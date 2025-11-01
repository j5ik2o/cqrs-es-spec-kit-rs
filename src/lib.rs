pub mod domain;
pub mod infrastructure;

// 主要な型を再エクスポート
pub use domain::user::{UserAggregate, UserEvent, UserEventId, UserId};
pub use infrastructure::event_store::{create_user_event_store, EventStoreConfig, UserEventStore, UserRepository};
