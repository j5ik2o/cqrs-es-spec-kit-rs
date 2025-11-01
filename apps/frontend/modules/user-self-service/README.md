# User Self-Service Module

利用者向けのセルフサービス機能を提供するモジュール。

## 概要

このモジュールは、エンドユーザが自分自身のアカウントを管理するための機能を提供します。

## 機能

- **サインアップ**: 新規ユーザ登録とメール認証
- **プロフィール確認**: 自分のアカウント情報の閲覧
- **退会手続き**: 自主的なアカウント退会

## ディレクトリ構成

```
user-self-service/
├── components/           # UIコンポーネント
│   ├── SignUpForm.tsx           # サインアップフォーム
│   ├── UserProfileCard.tsx      # プロフィール表示カード
│   └── WithdrawalConfirmation.tsx # 退会確認ダイアログ
├── lib/                  # ユーティリティとロジック
│   ├── types.ts                 # 型定義
│   └── validators.ts            # バリデーション関数
└── index.ts              # エクスポート定義
```

## 使用例

### サインアップフォーム

```tsx
import { SignUpForm } from '@/modules/user-self-service';

function SignUpPage() {
  const handleSignUp = async (data) => {
    // GraphQL Mutation を呼び出す
    await signUpUser(data);
  };

  return <SignUpForm onSubmit={handleSignUp} />;
}
```

### プロフィールカード

```tsx
import { UserProfileCard } from '@/modules/user-self-service';

function ProfilePage({ profile }) {
  return (
    <UserProfileCard profile={profile}>
      <button>プロフィールを編集</button>
    </UserProfileCard>
  );
}
```

### 退会確認

```tsx
import { WithdrawalConfirmation } from '@/modules/user-self-service';

function WithdrawPage() {
  const handleWithdraw = async () => {
    // GraphQL Mutation を呼び出す
    await withdrawSelf();
  };

  return (
    <WithdrawalConfirmation
      onConfirm={handleWithdraw}
      onCancel={() => router.back()}
    />
  );
}
```

## 関連するユーザーストーリー

- **User Story 1**: セルフサインアップとプロフィール確認 (Priority: P1)
- **User Story 2**: 自主退会の完了 (Priority: P2)

## GraphQL スキーマとの連携

このモジュールは以下の GraphQL Mutation/Query を使用します:

- `signUpUser`: 新規ユーザ登録
- `confirmUserEmail`: メール認証
- `viewer`: 認証済みユーザ情報の取得
- `withdrawSelf`: 退会処理

## アクセス制御

このモジュールのコンポーネントは、一般ユーザ向けのルート (`/app/(user)`) でのみ使用されます。
管理者向け機能は `user-admin-console` モジュールで提供されます。
