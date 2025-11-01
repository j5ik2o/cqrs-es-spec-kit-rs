# Data Model: ユーザ管理基盤初期構築

## ドメインモデル

### EndUserAccount (Aggregate Root)
- **目的**: 利用者の登録・認証・退会状態を一貫性を保って管理する。
- **属性**
  - `id` (ULID): 集約識別子。
  - `email` (string): 一意・正規化済みメールアドレス。重複不可。
  - `display_name` (string): 1〜50 文字の表示名。
  - `password_hash` (string): 強度ポリシーに適合したハッシュ値。
  - `status` (enum): `PENDING_EMAIL_VERIFICATION` / `ACTIVE` / `SUSPENDED` / `DEACTIVATED`。
  - `created_at` (timestamp): 集約作成日時。
  - `updated_at` (timestamp): 最終更新日時。
  - `email_verified_at` (timestamp|null): メール認証完了日時。
  - `withdrawn_at` (timestamp|null): 自主退会完了日時。
- **不変条件**
  - `email` は一意であり、退会済みであっても再利用時は復元判定を行う。
  - `status` 遷移は下記の許可ルートのみ。
  - `password_hash` は認証強度を満たす検証関数を通過する。
- **状態遷移**
  - `PENDING_EMAIL_VERIFICATION` → `ACTIVE` (メール確認成功)。
  - `ACTIVE` ↔ `SUSPENDED` (管理者操作)。
  - `ACTIVE` / `SUSPENDED` → `DEACTIVATED` (自主退会または管理者終了処理)。
  - `DEACTIVATED` → （再有効化は次フェーズ対象）。

### AdminAccount (Aggregate Root)
- **目的**: 管理者の認証・権限付与を行い、ユーザ状態変更の権限境界を守る。
- **属性**
  - `id` (ULID)
  - `email` (string): 一意。
  - `display_name` (string)
  - `role` (enum): `USER_SUPPORT` / `SECURITY_ADMIN` など運用定義。
  - `status` (enum): `ACTIVE` / `SUSPENDED`
  - `last_login_at` (timestamp|null)
  - `created_at` / `updated_at`
- **不変条件**
  - `role` はホワイトリストに存在する値のみ。
  - 管理者ステータスが `SUSPENDED` の場合、利用者状態変更コマンドを受付けない。

### AccountStatusAuditLog (Entity)
- **目的**: EndUserAccount の状態変化を監査証跡として保持する。
- **属性**
  - `account_status_audit_log_id` (ULID)
  - `end_user_account_id` (ULID)
  - `performed_by_admin_account_id` (ULID|null): 操作主体が管理者の場合に参照。
  - `previous_status` / `new_status` (enum)
  - `reason` (string)
  - `change_source` (enum): `SELF_SERVICE` / `ADMIN_CONSOLE` / `SYSTEM`
  - `occurred_at` (timestamp)
  - `related_user_notification_id` (ULID|null)
- **不変条件**
  - 記録される状態遷移は EndUserAccount の許容経路と一致する。

### UserNotification (Entity)
- **目的**: 送信された通知の追跡とリトライ制御を行う。
- **属性**
  - `user_notification_id` (ULID)
  - `end_user_account_id` (ULID)
  - `type` (enum): `SIGNUP_CONFIRMATION` / `WITHDRAWAL_COMPLETED` / `STATUS_CHANGED`
  - `channel` (enum): `EMAIL`
  - `status` (enum): `QUEUED` / `SENT` / `FAILED`
  - `template_id` (string)
  - `payload` (json)
  - `sent_at` (timestamp|null)
  - `retry_count` (int)
- **不変条件**
  - `retry_count` は 3 回を超えない。
  - `channel` は本フェーズでは `EMAIL` のみとする。

## ドメインイベント

| イベント名 | 発火条件 | ペイロード                                                                                              |
|------------|----------|----------------------------------------------------------------------------------------------------|
| `EndUserAccountRegistered` | サインアップ完了時 | `id`, `end_user_account_id`, `email`, `display_name`, `registered_at`                              |
| `EndUserEmailVerificationRequested` | 認証メール再送要求時 | `id`,`end_user_account_id`, `verification_token`, `requested_at`                                   |
| `EndUserEmailVerified` | メールリンク確認成功時 | `id`,`end_user_account_id`, `verified_at`                                                          |
| `EndUserAccountSuspended` | 管理者が一時停止した時 | `id`,`end_user_account_id`, `performed_by_admin_account_id`, `suspended_at`, `reason`              |
| `EndUserAccountReactivated` | 停止状態から再有効化 | `id`,`end_user_account_id`, `performed_by_admin_account_id`, `reactivated_at`                      |
| `EndUserAccountDeactivated` | 自主退会または管理者による終了 | `id`,`end_user_account_id`, `performed_by_admin_account_id` (optional), `deactivated_at`, `reason` |
| `EndUserAccountStatusNotified` | 通知送信が成功した時 | `id`,`user_notification_id`, `end_user_account_id`, `type`, `sent_at`                               |

`id` は ULID で採番するイベント識別子。

> これらのイベントは DynamoDB の `user-{end_user_account_id}` ストリームに蓄積し、Lambda→Kinesis→Lambda パイプラインを通じて読みモデルへ投影する。

## リードモデル

### EndUserProfileReadModel
- **用途**: ログイン済み利用者のマイページ表示。
- **フィールド**
  - `end_user_account_id`, `email`, `display_name`, `status`, `created_at`, `updated_at`, `email_verified_at`, `withdrawn_at`
- **更新ソース**: `EndUserAccountRegistered`, `EndUserEmailVerified`, `EndUserAccountSuspended`, `EndUserAccountReactivated`, `EndUserAccountDeactivated`

### AdminUserListReadModel
- **用途**: 管理者 UI の一覧・検索。
- **フィールド**
  - `end_user_account_id`, `email`, `display_name`, `status`, `created_at`, `updated_at`, `last_status_changed_at`
- **インデックス要件**: `status`, `created_at`, `email` でフィルタ可能な複合インデックス。
- **更新ソース**: 全ユーザ関連イベント。

### AccountStatusAuditLogReadModel
- **用途**: 管理者コンソールの監査ログ表示とエクスポート。
- **フィールド**
  - `account_status_audit_log_id`, `end_user_account_id`, `performed_by_admin_account_id`, `previous_status`, `new_status`, `reason`, `change_source`, `occurred_at`, `related_user_notification_id`
- **更新ソース**: 状態変更系イベント。

### UserNotificationReadModel
- **用途**: 通知送信状況の確認と再送制御。
- **フィールド**
  - `user_notification_id`, `end_user_account_id`, `type`, `channel`, `status`, `template_id`, `sent_at`, `retry_count`
- **更新ソース**: 通知生成/送信イベント。

## 関係性
- `EndUserAccount` 1 : n `AccountStatusAuditLog` (`end_user_account_id`)
- `EndUserAccount` 1 : n `UserNotification` (`end_user_account_id`)
- `AdminAccount` 1 : n `AccountStatusAuditLog` (`performed_by_admin_account_id`)
- 読みモデルはそれぞれイベント購読による非正規化ビューとして更新され、書き込みモデルとは CQRS により分離される。

## 読みモデルとドメインモデルの整合
- イベントソーシングによりドメインイベントが一次真実となり、Lambda ベースのリードモデル更新が冪等処理で反映される。
- 読みモデルの破損検知時は `EndUserAccount` イベントストリームをリプレイして復元する。
