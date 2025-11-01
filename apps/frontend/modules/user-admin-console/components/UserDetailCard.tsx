/**
 * UserDetailCard Component
 *
 * ユーザの詳細情報を表示するカードコンポーネント。
 * User Story 3 (管理者によるユーザ状況管理) で使用。
 */

'use client';

import type { ReactNode } from 'react';

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  accountStatus: 'pending' | 'active' | 'suspended' | 'withdrawn';
  emailVerified: boolean;
  registeredAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserDetailCardProps {
  user: UserDetail;
  children?: ReactNode;
}

/**
 * ユーザ詳細情報カードコンポーネント
 */
export function UserDetailCard({ user, children }: UserDetailCardProps) {
  return (
    <div className="user-detail-card" data-testid="user-detail-card">
      <div className="detail-header">
        <h2>ユーザ詳細</h2>
        <span className="user-id">ID: {user.id}</span>
      </div>
      <div className="detail-body">
        <div className="detail-section">
          <h3>基本情報</h3>
          <div className="detail-field">
            <span className="field-label">氏名</span>
            <span className="field-value">{user.name}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">メールアドレス</span>
            <span className="field-value">{user.email}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">メール認証</span>
            <span className="field-value">
              {user.emailVerified ? '認証済み' : '未認証'}
            </span>
          </div>
        </div>

        <div className="detail-section">
          <h3>アカウント状態</h3>
          <div className="detail-field">
            <span className="field-label">状態</span>
            <span className="field-value" data-status={user.accountStatus}>
              {getStatusLabel(user.accountStatus)}
            </span>
          </div>
          <div className="detail-field">
            <span className="field-label">登録日時</span>
            <span className="field-value">{formatDateTime(user.registeredAt)}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">最終更新日時</span>
            <span className="field-value">{formatDateTime(user.updatedAt)}</span>
          </div>
          {user.lastLoginAt && (
            <div className="detail-field">
              <span className="field-label">最終ログイン</span>
              <span className="field-value">{formatDateTime(user.lastLoginAt)}</span>
            </div>
          )}
        </div>
      </div>
      {children && <div className="detail-actions">{children}</div>}
    </div>
  );
}

function getStatusLabel(status: UserDetail['accountStatus']): string {
  switch (status) {
    case 'pending':
      return '仮登録';
    case 'active':
      return '有効';
    case 'suspended':
      return '一時停止';
    case 'withdrawn':
      return '退会済み';
    default:
      return '不明';
  }
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
