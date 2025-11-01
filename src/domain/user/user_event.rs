use super::user_id::UserId;
use chrono::{DateTime, Utc};
use event_store_adapter_rs::types::Event;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// ユーザーイベントID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct UserEventId(Uuid);

impl UserEventId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
}

impl Default for UserEventId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for UserEventId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// ユーザードメインイベント
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum UserEvent {
    /// ユーザーが作成された
    Created {
        id: UserEventId,
        aggregate_id: UserId,
        seq_nr: usize,
        name: String,
        email: String,
        occurred_at: DateTime<Utc>,
    },
    /// ユーザー名が更新された
    NameUpdated {
        id: UserEventId,
        aggregate_id: UserId,
        seq_nr: usize,
        name: String,
        occurred_at: DateTime<Utc>,
    },
    /// メールアドレスが更新された
    EmailUpdated {
        id: UserEventId,
        aggregate_id: UserId,
        seq_nr: usize,
        email: String,
        occurred_at: DateTime<Utc>,
    },
}

impl Event for UserEvent {
    type ID = UserEventId;
    type AggregateID = UserId;

    fn id(&self) -> &Self::ID {
        match self {
            UserEvent::Created { id, .. } => id,
            UserEvent::NameUpdated { id, .. } => id,
            UserEvent::EmailUpdated { id, .. } => id,
        }
    }

    fn aggregate_id(&self) -> &Self::AggregateID {
        match self {
            UserEvent::Created { aggregate_id, .. } => aggregate_id,
            UserEvent::NameUpdated { aggregate_id, .. } => aggregate_id,
            UserEvent::EmailUpdated { aggregate_id, .. } => aggregate_id,
        }
    }

    fn seq_nr(&self) -> usize {
        match self {
            UserEvent::Created { seq_nr, .. } => *seq_nr,
            UserEvent::NameUpdated { seq_nr, .. } => *seq_nr,
            UserEvent::EmailUpdated { seq_nr, .. } => *seq_nr,
        }
    }

    fn occurred_at(&self) -> &DateTime<Utc> {
        match self {
            UserEvent::Created { occurred_at, .. } => occurred_at,
            UserEvent::NameUpdated { occurred_at, .. } => occurred_at,
            UserEvent::EmailUpdated { occurred_at, .. } => occurred_at,
        }
    }

    fn is_created(&self) -> bool {
        matches!(self, UserEvent::Created { .. })
    }
}
