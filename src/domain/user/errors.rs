//! ドメインエラー

use thiserror::Error;

/// ユーザドメインエラー
#[derive(Error, Debug)]
pub enum UserError {
    /// プレースホルダーエラー（未実装）
    #[error("未実装")]
    Unimplemented,
}
