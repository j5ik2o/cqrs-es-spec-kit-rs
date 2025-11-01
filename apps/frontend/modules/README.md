# Frontend Modules

Next.js フロントエンドアプリケーションのモジュール分離ディレクトリ。

## 概要

このディレクトリは、フロントエンドアプリケーションの機能を独立したモジュールとして分離管理するために使用されます。
各モジュールは、特定のユーザーストーリーや機能領域に対応したコンポーネント、型定義、ユーティリティを含みます。

## モジュール一覧

### user-self-service

**目的**: 利用者向けのセルフサービス機能を提供

**主な機能**:
- サインアップとメール認証
- プロフィール確認
- 退会手続き

**対応ストーリー**:
- User Story 1: セルフサインアップとプロフィール確認 (P1)
- User Story 2: 自主退会の完了 (P2)

**使用ルート**: `/app/(user)/*`

詳細は [user-self-service/README.md](./user-self-service/README.md) を参照してください。

---

### user-admin-console

**目的**: 管理者向けのユーザ管理機能を提供

**主な機能**:
- ユーザ一覧表示（検索、フィルタ、ソート）
- ユーザ詳細確認
- ユーザ状態管理
- 監査ログ確認

**対応ストーリー**:
- User Story 3: 管理者によるユーザ状況管理 (P3)

**使用ルート**: `/app/(admin)/*`

詳細は [user-admin-console/README.md](./user-admin-console/README.md) を参照してください。

---

## モジュール構造の原則

### ディレクトリレイアウト

各モジュールは以下の標準構造を持ちます:

```
<module-name>/
├── components/           # UIコンポーネント
│   ├── *.tsx            # Reactコンポーネント
│   └── index.ts         # エクスポート定義
├── lib/                  # ユーティリティとロジック
│   ├── types.ts         # 型定義
│   ├── *.ts             # ユーティリティ関数
│   └── index.ts         # エクスポート定義
├── index.ts              # モジュールのエントリーポイント
└── README.md             # モジュールドキュメント
```

### モジュール分離の利点

1. **関心の分離**: 利用者向け機能と管理者向け機能を明確に分離
2. **再利用性**: 各モジュールが独立したコンポーネントとロジックを提供
3. **保守性**: 機能ごとに独立したディレクトリで管理
4. **テスト容易性**: モジュール単位でのテストが可能
5. **アクセス制御**: ルートグループと連携した権限管理

### インポート規約

モジュールは以下のようにインポートします:

```tsx
// 良い例: モジュールのインデックスからインポート
import { SignUpForm, UserProfileCard } from '@/modules/user-self-service';
import { UserListTable } from '@/modules/user-admin-console';

// 悪い例: 直接ファイルを指定しない
import { SignUpForm } from '@/modules/user-self-service/components/SignUpForm';
```

### コンポーネント設計原則

1. **プレゼンテーション層の分離**: コンポーネントはUIに集中し、ビジネスロジックはGraphQL層で処理
2. **型安全性**: すべてのpropsとイベントハンドラに型定義を提供
3. **アクセシビリティ**: ARIA属性とセマンティックHTMLを使用
4. **テスタビリティ**: `data-testid` 属性を使用してE2Eテストを容易に

## GraphQL BFF との連携

すべてのモジュールは、GraphQL BFF を経由してバックエンドと通信します:

```
Next.js Module → GraphQL BFF → Command Service / Read Model
```

- コンポーネントは直接 MySQL やコマンドサービスへアクセスしません
- すべての通信は BFF の GraphQL エンドポイント経由で行います
- GraphQL スキーマの変更はフロント契約を破壊しないように管理します

## アクセス制御とルーティング

### ルートグループによる分離

```
app/
├── (user)/              # 利用者向けルート
│   ├── signup/          # user-self-service モジュールを使用
│   ├── account/         # user-self-service モジュールを使用
│   └── ...
└── (admin)/             # 管理者向けルート
    ├── users/           # user-admin-console モジュールを使用
    └── ...
```

### 権限チェック

- `(user)` ルート: 認証済みユーザのみアクセス可能
- `(admin)` ルート: 管理者権限を持つユーザのみアクセス可能
- 権限チェックは NextAuth.js のミドルウェアで実施

## 開発ガイドライン

### 新しいモジュールの追加

1. モジュールディレクトリを作成: `modules/<module-name>/`
2. 標準構造に従ってファイルを配置
3. `index.ts` でエクスポートを定義
4. `README.md` でドキュメントを作成
5. このファイルにモジュール情報を追加

### コンポーネントの追加

1. `components/` ディレクトリにコンポーネントファイルを作成
2. 型定義を `lib/types.ts` に追加
3. `components/index.ts` でエクスポート
4. 必要に応じて `lib/` にユーティリティ関数を追加

## テスト戦略

### ユニットテスト

- コンポーネント: React Testing Library
- ユーティリティ関数: Jest

### E2Eテスト

- Playwright を使用
- ユーザーストーリー単位でシナリオを作成
- `apps/frontend/tests/e2e/` に配置

## 関連ドキュメント

- [Plan](../../../specs/001-init-user-management/plan.md)
- [Spec](../../../specs/001-init-user-management/spec.md)
- [Tasks](../../../specs/001-init-user-management/tasks.md)
- [Project Constitution](../../../.specify/memory/constitution.md)
