# データモデル: ユーザ管理機能

## 集約: UserAccount

| 属性 | 型 | 概要 | バリデーション/制約 |
|------|----|------|---------------------|
| `id` | ULID | 集約識別子 | 生成時に一意。Kinesis パーティションキーとしても利用する。 |
| `email` | EmailAddress | ログイン ID | RFC 5322 準拠、大文字小文字正規化、一意制約。 |
| `password` | PasswordCredential | ハッシュ化されたパスワード | PBKDF2/Bcrypt/Scrypt のいずれかを採用（既定: Argon2id）。12 文字以上の強度検証を通過したもののみ保持。 |
| `profile` | Profile | 表示名・自己紹介・アバター情報 | 表示名 2〜50 文字、自己紹介最大 400 文字、アバターは S3 オブジェクトキー参照。 |
| `settings` | UserSettings | 通知設定と言語/タイムゾーン | 通知: `EMAIL_ON`/`EMAIL_OFF`、`locale` は ISO 639-1、`time_zone` は IANA TZ DB。 |
| `verification` | VerificationStatus | `Pending`, `Verified`, `Locked` | トークン期限切れ / ロックアウト条件を保持。 |
| `created_at` | DateTime (UTC) | 作成日時 | イベント `AccountCreated` から生成。 |
| `updated_at` | DateTime (UTC) | 最終更新日時 | 各イベント適用時に更新。 |
| `last_session_issued_at` | Option<DateTime> | 直近のセッション発行 | `SessionIssued` 適用時に設定。 |

### 集約内コレクション
- `active_sessions: Vec<SessionRef>`（最大 10 件、期限切れはリプレイ時に自動削除）
- `pending_token: Option<VerificationToken>`（`Verified` へ遷移時に無効化）

## 値オブジェクト

### EmailAddress
- 書式: RFC 5322 を `validator` crate を用いて検証。
- 保存時は小文字に正規化し、トリム後に再検証。
- ドメイン制限: allowlist/denylist を設定可能（MVP は制限なし、設定ファイルで拡張）。

### PasswordCredential
- 構成: `hash`, `algorithm`, `salt`, `hashed_at`。
- 入力値は平文を保持せず、ハッシュ化済み文字列のみ格納。
- アルゴリズム: Argon2id（メモリ 64MB, time 3, parallelism 1）を既定値とし、構成ファイルから調整可能。
- バリデーション: 12 文字以上、英大文字・英小文字・数字を最低 1 文字ずつ、禁止ワードリスト照合。

### Profile
- `display_name`: 2〜50 文字、ユニコード正規化 NFC。
- `bio`: 最大 400 文字、HTML タグ禁止（サニタイズ済みマークダウンを別途利用）。
- `avatar`: `object_key`（S3 キー）、`url`（署名付き URL 生成用パス）、`mime_type`（`image/png` or `image/jpeg`）、`updated_at`。
- ファイルサイズ: 2MB 上限。`object_key` は `avatars/{user_account_id}/{ulid}` 形式。

### UserSettings
- `notification_preference`: enum `EMAIL_ON` or `EMAIL_OFF`。
- `locale`: ISO 639-1 + 国コード（例: `ja-JP`）。
- `time_zone`: IANA Time Zone（例: `Asia/Tokyo`）。
- `updated_at`: DateTime。

### VerificationToken
- `value`: ULID ベースの 26 文字。
- `expires_at`: DateTime（既定 24 時間後）。
- `requested_at`: DateTime。
- `resend_count`: u8（最大 5 回、超過でステータス `Locked` へ遷移）。

### SessionRef
- `session_id`: ULID。
- `issued_at`: DateTime。
- `expires_at`: DateTime（既定 30 分、Remember me 標準 7 日への拡張は後続検討）。
- `device_fp`: Optional<String>（BFF で収集した指紋ハッシュ）。

## リードモデル（Aurora MySQL）

- `user_accounts`
  - カラム: `id (CHAR(26) PK)`, `email (VARCHAR(320) UNIQUE)`, `status (ENUM('PENDING','VERIFIED','LOCKED'))`, `verified_at (DATETIME NULL)`, `locked_reason (VARCHAR(120) NULL)`, `created_at`, `updated_at`。
  - インデックス: `idx_user_accounts_email`、`idx_user_accounts_status`。
  - 用途: アカウント一覧、状態確認、サポート向け管理 UI。

- `user_profiles`
  - カラム: `id (CHAR(26) PK)`, `user_account_id (CHAR(26) UNIQUE)`, `display_name (VARCHAR(50))`, `bio (VARCHAR(400))`, `avatar_url (TEXT NULL)`, `avatar_object_key (VARCHAR(255) NULL)`, `updated_at`。
  - 外部キー: `user_account_id` → `user_accounts(id)`。
  - インデックス: `idx_user_profiles_display_name`（部分一致検索用）、`uk_user_profiles_account`（`user_account_id` UNIQUE）。
  - 用途: ユーザホーム表示、プロフィール検索。

- `user_settings`
  - カラム: `id (CHAR(26) PK)`, `user_account_id (CHAR(26) UNIQUE)`, `notification_preference (ENUM('EMAIL_ON','EMAIL_OFF'))`, `locale (VARCHAR(8))`, `time_zone (VARCHAR(32))`, `updated_at`。
  - 外部キー: `user_account_id` → `user_accounts(id)`。
  - インデックス: `idx_user_settings_notification`, `idx_user_settings_locale`, `uk_user_settings_account`。
  - 用途: 設定画面、通知設定のバッチ処理。

- `user_sessions`
  - カラム: `id (CHAR(26) PK)`, `user_account_id (CHAR(26))`, `issued_at`, `expires_at`, `revoked_at NULL`, `device_label (VARCHAR(80) NULL)`。
  - 外部キー: `user_account_id` → `user_accounts(id)`。
  - インデックス: `idx_user_sessions_account`, `idx_user_sessions_expires_at`。
  - 用途: ログイン履歴表示、セッション失効処理。

- `user_home_view`
  - カラム: `id (CHAR(26) PK)`, `user_account_id (CHAR(26) UNIQUE)`, `display_name`, `avatar_url`, `email`, `notification_preference`, `locale`, `time_zone`, `recent_notifications (JSON)`, `last_login_at`, `pending_verification (BOOLEAN)`。
  - 外部キー: `user_account_id` → `user_accounts(id)`。
  - 用途: GraphQL `viewer` クエリ用。`recent_notifications` は最新 10 件の通知メタデータを JSON 配列で保持。

## DynamoDB テーブル

| テーブル | パーティションキー | ソートキー | 用途 |
|----------|-------------------|------------|------|
| `journal` | `aggregate_id` | `sequence_nr` | UserAccount イベントジャーナル。|
| `journal-aid-index` | `aggregate_id` | `occurred_at` | プロジェクション用 GSI。|
| `snapshot` | `aggregate_id` | `seq_nr` | スナップショット保存（50 イベント間隔）。|
| `verification_tokens` | `token_value` | なし | 未使用または再送中のトークン管理。TTL を設定。|
| `sessions` | `session_id` | なし | アクティブセッションの高速参照。TTL 付き。|

## 状態遷移

### アカウント状態

| 現状態 | トリガーイベント | 遷移後 | 備考 |
|--------|------------------|---------|------|
| `Pending` | `AccountVerified` | `Verified` | メール確認リンク成功時。 |
| `Pending` | トークン期限切れ (`expires_at` 経過) | `Pending`（再発行） | `resend_count` が 5 を超えた場合 `Locked` へ。 |
| `Verified` | `LockAccount`（連続失敗など） | `Locked` | ロック解除は後続仕様。 |
| `Locked` | 管理者解除（将来拡張） | `Pending` | 本リリースでは未実装。 |

### セッション状態

| 現状態 | トリガー | 遷移後 |
|--------|----------|---------|
| 非保持 | `SessionIssued` | アクティブ（`session_id` 登録） |
| アクティブ | `SignOut` または TTL | 非保持 |

## S3 オブジェクト構造
- バケット: `user-profile-images`（LocalStack では `user-profile-images-local`）。
- キー形式: `avatars/{user_account_id}/{yyyy}/{MM}/{dd}/{ulid}.{ext}`。
- ライフサイクル: 90 日後に旧バージョン削除、最新バージョンのみ保持。

## 通知モデル
- 送信種別: `SIGNUP_CONFIRMATION`, `SIGNUP_REMINDER`, `PROFILE_UPDATED`。
- SES テンプレート ID を `notification_templates` DynamoDB テーブルで管理（オプション）。
- LocalStack では MailHog で受信確認。

## イベントとリードモデルの対応

| イベント | リードモデル更新 | 追加処理 |
|----------|------------------|----------|
| `AccountCreated` | `user_accounts` 新規行、`user_home_view` 初期レコード、`verification_tokens` に登録 | 認証メール送信ジョブをキューイング |
| `AccountVerified` | `user_accounts.status` 更新、`verified_at` 設定、`pending_verification` false | `verification_tokens` 無効化 |
| `SessionIssued` | `user_sessions` 追加、`user_home_view.last_login_at` 更新、`sessions` DynamoDB へ TTL 付き保存 | BFF へセッショントークン返却 |
| `ProfileUpdated` | `user_profiles` / `user_home_view` 更新、S3 アバターキー更新 | 古いアバターオブジェクトの削除をバックグラウンド実行 |
| `SettingsUpdated` | `user_settings` / `user_home_view` 更新 | 通知設定に応じた購読リスト更新 |

## 参照整合性
- MySQL テーブルは `user_account_id` を外部キー制約で結び、イベント再生失敗時はトランザクションをロールバック。
- DynamoDB への書き込みは Idempotency Key を `aggregate_id + sequence_nr` として利用し、Lambda の再実行での重複を防ぐ。
- セッション失効は DynamoDB TTL に加え、MySQL `user_sessions` での `expires_at` をバッチで掃除する。
