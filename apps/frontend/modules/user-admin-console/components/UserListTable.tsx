/**
 * UserListTable Component
 *
 * ユーザ一覧を表形式で表示するコンポーネント。
 * User Story 3 (管理者によるユーザ状況管理) で使用。
 */

'use client';

import type { ReactNode } from 'react';

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  accountStatus: 'pending' | 'active' | 'suspended' | 'withdrawn';
  registeredAt: string;
}

export interface UserListTableProps {
  users: UserListItem[];
  onUserClick?: (userId: string) => void;
  isLoading?: boolean;
  emptyMessage?: ReactNode;
}

/**
 * ユーザ一覧テーブルコンポーネント
 */
export function UserListTable({
  users,
  onUserClick,
  isLoading = false,
  emptyMessage = 'ユーザが見つかりませんでした',
}: UserListTableProps) {
  if (isLoading) {
    return (
      <div className="user-list-loading" data-testid="user-list-loading">
        読み込み中...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="user-list-empty" data-testid="user-list-empty">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="user-list-table" data-testid="user-list-table">
      <table>
        <thead>
          <tr>
            <th>氏名</th>
            <th>メールアドレス</th>
            <th>状態</th>
            <th>登録日</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} data-user-id={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <span className="status-badge" data-status={user.accountStatus}>
                  {getStatusLabel(user.accountStatus)}
                </span>
              </td>
              <td>{formatDate(user.registeredAt)}</td>
              <td>
                {onUserClick && (
                  <button
                    type="button"
                    onClick={() => onUserClick(user.id)}
                    className="view-detail-button"
                  >
                    詳細
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getStatusLabel(status: UserListItem['accountStatus']): string {
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

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
}
