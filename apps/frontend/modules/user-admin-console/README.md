# User Admin Console Module

管理者向けのユーザ管理機能を提供するモジュール。

## 概要

このモジュールは、管理者がユーザアカウントを監視・管理するための機能を提供します。

## 機能

- **ユーザ一覧表示**: 登録ユーザの一覧表示、検索、フィルタリング、ソート
- **ユーザ詳細確認**: 個別ユーザの詳細情報閲覧
- **ユーザ状態管理**: アカウント状態の変更（有効化、一時停止、退会済み設定）
- **監査ログ確認**: 管理者操作の履歴確認

## ディレクトリ構成

```
user-admin-console/
├── components/           # UIコンポーネント
│   ├── UserListTable.tsx        # ユーザ一覧テーブル
│   ├── UserDetailCard.tsx       # ユーザ詳細カード
│   ├── UserStatusControl.tsx    # 状態変更コントロール
│   └── AuditLogViewer.tsx       # 監査ログビューア
├── lib/                  # ユーティリティとロジック
│   ├── types.ts                 # 型定義
│   └── filters.ts               # フィルタリング関数
└── index.ts              # エクスポート定義
```

## 使用例

### ユーザ一覧テーブル

```tsx
import { UserListTable } from '@/modules/user-admin-console';

function AdminUsersPage({ users }) {
  const handleUserClick = (userId) => {
    router.push(`/admin/users/${userId}`);
  };

  return (
    <UserListTable
      users={users}
      onUserClick={handleUserClick}
    />
  );
}
```

### ユーザ詳細カード

```tsx
import { UserDetailCard } from '@/modules/user-admin-console';

function UserDetailPage({ user }) {
  return (
    <UserDetailCard user={user}>
      <button>編集</button>
    </UserDetailCard>
  );
}
```

### ユーザ状態変更

```tsx
import { UserStatusControl } from '@/modules/user-admin-console';

function UserManagementPage({ user }) {
  const handleStatusChange = async (userId, newStatus, reason) => {
    // GraphQL Mutation を呼び出す
    await updateUserStatus({ userId, newStatus, reason });
  };

  return (
    <UserStatusControl
      currentStatus={user.accountStatus}
      userId={user.id}
      onStatusChange={handleStatusChange}
    />
  );
}
```

### 監査ログビューア

```tsx
import { AuditLogViewer } from '@/modules/user-admin-console';

function AuditLogPage({ logs }) {
  return <AuditLogViewer logs={logs} />;
}
```

## 関連するユーザーストーリー

- **User Story 3**: 管理者によるユーザ状況管理 (Priority: P3)

## GraphQL スキーマとの連携

このモジュールは以下の GraphQL Mutation/Query を使用します:

- `adminUsers`: ユーザ一覧の取得
- `adminUserAuditTrail`: 監査ログの取得
- `updateUserStatus`: ユーザ状態の変更

## アクセス制御

このモジュールのコンポーネントは、管理者向けのルート (`/app/(admin)`) でのみ使用されます。

### 権限制御

- 管理者は他の管理者アカウントを変更できません
- 自身の状態変更は別プロセスに委ねられます
- すべての操作は監査ログに記録されます

## セキュリティ考慮事項

- 状態変更時には必ず理由の入力を必須とします
- 確認ダイアログを表示し、誤操作を防止します
- すべての操作は監査ログに記録され、追跡可能です
