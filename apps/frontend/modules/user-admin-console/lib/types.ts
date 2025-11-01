/**
 * User Admin Console Types
 *
 * 管理者コンソールモジュールで使用する型定義。
 */

/**
 * ユーザアカウント状態
 */
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'withdrawn';

/**
 * 管理者向けユーザ情報
 */
export interface AdminUserInfo {
  id: string;
  name: string;
  email: string;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  registeredAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

/**
 * ユーザリストフィルタ
 */
export interface UserListFilter {
  status?: AccountStatus;
  emailVerified?: boolean;
  searchTerm?: string;
  sortBy?: 'name' | 'email' | 'registeredAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * ページネーション情報
 */
export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * ユーザ一覧レスポンス
 */
export interface UserListResponse {
  users: AdminUserInfo[];
  pagination: Pagination;
}

/**
 * ユーザ状態変更リクエスト
 */
export interface UpdateUserStatusRequest {
  userId: string;
  newStatus: AccountStatus;
  reason: string;
}

/**
 * ユーザ状態変更レスポンス
 */
export interface UpdateUserStatusResponse {
  success: boolean;
  message: string;
  auditLogId?: string;
}

/**
 * 監査ログエントリ
 */
export interface AccountStatusAuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  targetUserId: string;
  targetUserName: string;
  action: string;
  previousStatus?: AccountStatus;
  newStatus?: AccountStatus;
  reason: string;
  result: 'success' | 'failure';
  notificationSent: boolean;
}

/**
 * 監査ログフィルタ
 */
export interface AuditLogFilter {
  userId?: string;
  adminId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  result?: 'success' | 'failure';
}

/**
 * 監査ログレスポンス
 */
export interface AuditLogResponse {
  logs: AccountStatusAuditLog[];
  pagination: Pagination;
}
