/**
 * User Self-Service Types
 *
 * セルフサービスモジュールで使用する型定義。
 */

/**
 * アカウント状態
 */
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'withdrawn';

/**
 * エンドユーザアカウント
 */
export interface EndUserAccount {
  id: string;
  name: string;
  email: string;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  registeredAt: string;
  updatedAt: string;
}

/**
 * サインアップリクエスト
 */
export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

/**
 * サインアップレスポンス
 */
export interface SignUpResponse {
  success: boolean;
  userId?: string;
  message: string;
}

/**
 * メール認証リクエスト
 */
export interface ConfirmEmailRequest {
  token: string;
}

/**
 * 退会リクエスト
 */
export interface WithdrawalRequest {
  reason?: string;
}

/**
 * 退会レスポンス
 */
export interface WithdrawalResponse {
  success: boolean;
  message: string;
}
