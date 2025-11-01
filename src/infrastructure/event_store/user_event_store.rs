use crate::domain::user::{UserAggregate, UserEvent, UserId};
use aws_sdk_dynamodb::Client;
use event_store_adapter_rs::{
    types::{Aggregate, Event, EventStore, EventStoreReadError, EventStoreWriteError},
    EventStoreForDynamoDB,
};

/// ユーザー集約のイベントストア
pub type UserEventStore = EventStoreForDynamoDB<UserId, UserAggregate, UserEvent>;

/// イベントストアの設定
#[derive(Debug, Clone)]
pub struct EventStoreConfig {
    /// ジャーナルテーブル名
    pub journal_table_name: String,
    /// ジャーナルAIDインデックス名
    pub journal_aid_index_name: String,
    /// スナップショットテーブル名
    pub snapshot_table_name: String,
    /// スナップショットAIDインデックス名
    pub snapshot_aid_index_name: String,
    /// シャード数
    pub shard_count: u64,
    /// 保持するスナップショット数
    pub keep_snapshot_count: Option<usize>,
}

impl Default for EventStoreConfig {
    fn default() -> Self {
        Self {
            journal_table_name: "journal".to_string(),
            journal_aid_index_name: "journal-aid-index".to_string(),
            snapshot_table_name: "snapshot".to_string(),
            snapshot_aid_index_name: "snapshot-aid-index".to_string(),
            shard_count: 64,
            keep_snapshot_count: Some(2),
        }
    }
}

/// イベントストアを作成する
pub fn create_user_event_store(client: Client, config: EventStoreConfig) -> UserEventStore {
    EventStoreForDynamoDB::new(
        client,
        config.journal_table_name,
        config.journal_aid_index_name,
        config.snapshot_table_name,
        config.snapshot_aid_index_name,
        config.shard_count,
    )
    .with_keep_snapshot_count(config.keep_snapshot_count)
}

/// イベントストアのリポジトリトレイト
#[async_trait::async_trait]
pub trait UserRepository: Send + Sync {
    /// イベントを保存する
    async fn persist_event(&mut self, event: &UserEvent, version: usize) -> Result<(), EventStoreWriteError>;

    /// イベントとスナップショットを保存する
    async fn persist_event_and_snapshot(
        &mut self,
        event: &UserEvent,
        aggregate: &UserAggregate,
    ) -> Result<(), EventStoreWriteError>;

    /// 最新のスナップショットを取得する
    async fn get_latest_snapshot_by_id(&self, id: &UserId) -> Result<Option<UserAggregate>, EventStoreReadError>;

    /// 指定したシーケンス番号以降のイベントを取得する
    async fn get_events_by_id_since_seq_nr(&self, id: &UserId, seq_nr: usize) -> Result<Vec<UserEvent>, EventStoreReadError>;

    /// 集約を再構築する
    async fn replay(&self, id: &UserId) -> Result<Option<UserAggregate>, EventStoreReadError>;
}

#[async_trait::async_trait]
impl UserRepository for UserEventStore {
    async fn persist_event(&mut self, event: &UserEvent, version: usize) -> Result<(), EventStoreWriteError> {
        EventStore::persist_event(self, event, version).await
    }

    async fn persist_event_and_snapshot(
        &mut self,
        event: &UserEvent,
        aggregate: &UserAggregate,
    ) -> Result<(), EventStoreWriteError> {
        EventStore::persist_event_and_snapshot(self, event, aggregate).await
    }

    async fn get_latest_snapshot_by_id(&self, id: &UserId) -> Result<Option<UserAggregate>, EventStoreReadError> {
        EventStore::get_latest_snapshot_by_id(self, id).await
    }

    async fn get_events_by_id_since_seq_nr(&self, id: &UserId, seq_nr: usize) -> Result<Vec<UserEvent>, EventStoreReadError> {
        EventStore::get_events_by_id_since_seq_nr(self, id, seq_nr).await
    }

    async fn replay(&self, id: &UserId) -> Result<Option<UserAggregate>, EventStoreReadError> {
        // スナップショットを取得
        let snapshot = EventStore::get_latest_snapshot_by_id(self, id).await?;

        match snapshot {
            Some(mut aggregate) => {
                // スナップショット以降のイベントを取得
                let events = EventStore::get_events_by_id_since_seq_nr(self, id, aggregate.seq_nr() + 1).await?;

                // イベントを適用して集約を再構築
                for event in events {
                    aggregate.apply_event(&event);
                }

                Ok(Some(aggregate))
            }
            None => {
                // スナップショットがない場合は、最初からイベントを取得
                let events = EventStore::get_events_by_id_since_seq_nr(self, id, 0).await?;

                if events.is_empty() {
                    return Ok(None);
                }

                // 最初のイベントから集約を構築
                let first_event = &events[0];
                if !first_event.is_created() {
                    return Err(EventStoreReadError::OtherError(
                        "First event must be a Created event".to_string(),
                    ));
                }

                let mut aggregate = match first_event {
                    UserEvent::Created { aggregate_id, name, email, .. } => {
                        UserAggregate::new(aggregate_id.clone(), name.clone(), email.clone())
                    }
                    _ => unreachable!(),
                };

                // 残りのイベントを適用
                for event in events.iter().skip(1) {
                    aggregate.apply_event(event);
                }

                Ok(Some(aggregate))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    #[tokio::test]
    async fn test_user_repository_trait() {
        // このテストは型チェックのみを目的としています
        // 実際のテストは統合テストで行います
    }
}
