/**
 * User Admin Console Filters
 *
 * 管理者コンソールモジュールで使用するフィルタリング関数群。
 */

import type { AccountStatus, AdminUserInfo, UserListFilter } from './types';

/**
 * ユーザリストをフィルタリングする
 */
export function filterUsers(
  users: AdminUserInfo[],
  filter: UserListFilter
): AdminUserInfo[] {
  let filtered = [...users];

  // 状態でフィルタ
  if (filter.status) {
    filtered = filtered.filter((user) => user.accountStatus === filter.status);
  }

  // メール認証状態でフィルタ
  if (filter.emailVerified !== undefined) {
    filtered = filtered.filter((user) => user.emailVerified === filter.emailVerified);
  }

  // 検索キーワードでフィルタ
  if (filter.searchTerm) {
    const searchLower = filter.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    );
  }

  // ソート
  if (filter.sortBy) {
    filtered = sortUsers(filtered, filter.sortBy, filter.sortOrder || 'asc');
  }

  return filtered;
}

/**
 * ユーザリストをソートする
 */
export function sortUsers(
  users: AdminUserInfo[],
  sortBy: 'name' | 'email' | 'registeredAt' | 'updatedAt',
  sortOrder: 'asc' | 'desc' = 'asc'
): AdminUserInfo[] {
  const sorted = [...users];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'ja');
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'registeredAt':
        comparison = new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * アカウント状態のラベルを取得する
 */
export function getAccountStatusLabel(status: AccountStatus): string {
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

/**
 * 有効なアカウント状態一覧を取得する
 */
export function getAccountStatuses(): AccountStatus[] {
  return ['pending', 'active', 'suspended', 'withdrawn'];
}
