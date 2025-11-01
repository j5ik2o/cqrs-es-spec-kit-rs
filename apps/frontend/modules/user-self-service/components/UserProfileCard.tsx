/**
 * UserProfileCard Component
 *
 * ユーザのプロフィール情報を表示するカードコンポーネント。
 * User Story 1 (セルフサインアップとプロフィール確認) で使用。
 */

'use client';

import type { ReactNode } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  accountStatus: 'pending' | 'active' | 'suspended' | 'withdrawn';
}

export interface UserProfileCardProps {
  profile: UserProfile;
  children?: ReactNode;
}

/**
 * プロフィール情報を表示するカードコンポーネント
 */
export function UserProfileCard({ profile, children }: UserProfileCardProps) {
  return (
    <div className="user-profile-card" data-testid="user-profile-card">
      <div className="profile-header">
        <h2>プロフィール</h2>
      </div>
      <div className="profile-body">
        <div className="profile-field">
          <span className="field-label">氏名</span>
          <span className="field-value">{profile.name}</span>
        </div>
        <div className="profile-field">
          <span className="field-label">メールアドレス</span>
          <span className="field-value">{profile.email}</span>
        </div>
        <div className="profile-field">
          <span className="field-label">登録日</span>
          <span className="field-value">{profile.registeredAt}</span>
        </div>
        <div className="profile-field">
          <span className="field-label">アカウント状態</span>
          <span className="field-value" data-status={profile.accountStatus}>
            {getStatusLabel(profile.accountStatus)}
          </span>
        </div>
      </div>
      {children && <div className="profile-actions">{children}</div>}
    </div>
  );
}

function getStatusLabel(status: UserProfile['accountStatus']): string {
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
