use event_store_adapter_rs::types::AggregateId;
use serde::{Deserialize, Serialize};
use std::fmt;
use uuid::Uuid;

/// ユーザー集約のID
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct UserId(Uuid);

impl UserId {
    /// 新しいユーザーIDを生成する
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }

    /// UUID から UserId を生成する
    pub fn from_uuid(uuid: Uuid) -> Self {
        Self(uuid)
    }

    /// 内部の UUID を取得する
    pub fn as_uuid(&self) -> &Uuid {
        &self.0
    }
}

impl Default for UserId {
    fn default() -> Self {
        Self::new()
    }
}

impl fmt::Display for UserId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl AggregateId for UserId {
    fn type_name(&self) -> String {
        "User".to_string()
    }

    fn value(&self) -> String {
        self.0.to_string()
    }
}
