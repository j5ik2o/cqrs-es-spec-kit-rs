//! # ユーザ集約モジュール
//!
//! ユーザ管理に関するドメインモデルを定義する。
//!
//! ## 責務
//! - ユーザの登録、認証、プロフィール更新などのビジネスロジック
//! - ユーザ集約の不変条件の維持
//! - ドメインイベントの発行
//!
//! ## DDD境界
//! - アグリゲートルート: `User`
//! - 値オブジェクト: `UserId`, `Email`, `HashedPassword`, `UserName`
//! - コマンド: `RegisterUser`, `VerifyEmail`, `UpdateProfile`
//! - イベント: `UserRegistered`, `EmailVerified`, `ProfileUpdated`
//!
//! ## 設計原則
//! - 集約の不変条件は必ずアグリゲートルート内で検証する
//! - 外部ライブラリ・インフラへの直接依存を禁止する
//! - すべての状態遷移はコマンドを経由してドメインイベントに変換する

// ============================================
// サブモジュール宣言
// ============================================

/// ユーザ集約ルート
pub mod aggregate;

/// コマンド定義
pub mod commands;

/// ドメインイベント
pub mod events;

/// 値オブジェクト
pub mod value_objects;

/// ドメインエラー
pub mod errors;

// ============================================
// 公開エクスポート
// ============================================

// アグリゲート
pub use aggregate::User;

// 値オブジェクト
pub use value_objects::{Email, HashedPassword, UserId, UserName, UserStatus};

// コマンド
pub use commands::{RegisterUser, UpdateProfile, VerifyEmail};

// イベント
pub use events::{EmailVerified, ProfileUpdated, UserEvent, UserRegistered};

// エラー
pub use errors::UserError;
