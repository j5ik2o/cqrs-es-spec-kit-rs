use super::user_event::UserEvent;
use super::user_id::UserId;
use chrono::{DateTime, Utc};
use event_store_adapter_rs::types::Aggregate;
use serde::{Deserialize, Serialize};

/// ユーザー集約
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserAggregate {
    /// 集約ID
    id: UserId,
    /// ユーザー名
    name: String,
    /// メールアドレス
    email: String,
    /// シーケンス番号
    seq_nr: usize,
    /// バージョン
    version: usize,
    /// 最終更新日時
    last_updated_at: DateTime<Utc>,
}

impl UserAggregate {
    /// 新しいユーザー集約を作成する
    pub fn new(id: UserId, name: String, email: String) -> Self {
        Self {
            id,
            name,
            email,
            seq_nr: 0,
            version: 0,
            last_updated_at: Utc::now(),
        }
    }

    /// イベントを適用して集約を更新する
    pub fn apply_event(&mut self, event: &UserEvent) {
        match event {
            UserEvent::Created {
                name,
                email,
                occurred_at,
                seq_nr,
                ..
            } => {
                self.name = name.clone();
                self.email = email.clone();
                self.seq_nr = *seq_nr;
                self.last_updated_at = *occurred_at;
            }
            UserEvent::NameUpdated {
                name,
                occurred_at,
                seq_nr,
                ..
            } => {
                self.name = name.clone();
                self.seq_nr = *seq_nr;
                self.last_updated_at = *occurred_at;
            }
            UserEvent::EmailUpdated {
                email,
                occurred_at,
                seq_nr,
                ..
            } => {
                self.email = email.clone();
                self.seq_nr = *seq_nr;
                self.last_updated_at = *occurred_at;
            }
        }
    }

    /// ユーザー名を取得する
    pub fn name(&self) -> &str {
        &self.name
    }

    /// メールアドレスを取得する
    pub fn email(&self) -> &str {
        &self.email
    }
}

impl Aggregate for UserAggregate {
    type ID = UserId;

    fn id(&self) -> &Self::ID {
        &self.id
    }

    fn seq_nr(&self) -> usize {
        self.seq_nr
    }

    fn version(&self) -> usize {
        self.version
    }

    fn set_version(&mut self, version: usize) {
        self.version = version;
    }

    fn last_updated_at(&self) -> &DateTime<Utc> {
        &self.last_updated_at
    }
}
