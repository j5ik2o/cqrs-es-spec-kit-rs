# Quickstart: ユーザ管理基盤初期構築

## 前提ツール
1. Rust 1.80 系 toolchain (`rustup default stable`)
2. Node.js 20 LTS + pnpm 9 系
3. AWS CLI v2（SES 構成確認用）
4. Docker / Docker Compose (LocalStack, MySQL, Redis 起動)

## 初期セットアップ
1. `pnpm install --filter frontend` で Next.js 依存を解決。
2. `cargo fetch` で Rust 依存関係を取得。
3. `docker-compose -f docker-compose.local.yml up -d localstack mysql redis` でローカル基盤を起動。
4. `scripts/localstack/bootstrap.sh` → `scripts/localstack/deploy-lambdas.sh` を順に実行し、イベントストアと Lambda を初期化。
5. `aws ses verify-email-identity --email-address <通知送信元>` を実行し、SES 送信元メールを検証。

## アプリケーション実行
- コマンドサービス: `cargo run --bin user-command-service`
- GraphQL BFF: `cargo run --bin bff`（既存構成を再利用し Mutation/Subscription を拡張）
- Next.js (利用者/管理者 UI): `pnpm --filter frontend dev`

## テスト
1. ドメイン/アプリ層: `cargo test`
2. Lambda パッケージ検証: `cargo lambda build --release`
3. 統合テスト: `cargo test --package integration-tests`
4. フロントエンド: `pnpm --filter frontend test`（Vitest）
5. E2E: `pnpm --filter frontend test:e2e`（Playwright、LocalStack を利用）

## ローカル検証フロー
1. 新規利用者が `http://localhost:3000` からサインアップ。
2. LocalStack SES で確認メールを受信 (`aws sesv2 list-email-identities` / ローカルログ参照)。
3. メール内リンクを踏むと `viewer` Query が `ACTIVE` 状態を返すことを確認。
4. 管理者 UI (`http://localhost:3000/admin`) で対象ユーザを検索し、状態変更を実施。
5. 退会処理を実行し、監査ログと通知履歴が更新されることを確認。

## トラブルシュート
- メール重複エラー: GraphQL Mutation の `EmailAlreadyRegistered` エラーコードを返却。既存アカウントへのリカバリ案内を表示する。
- Lambda イベント遅延: Kinesis シュードレートを確認し、必要に応じてシャード数を調整。
- SES 送信失敗: `UserNotification` の `retry_count` がしきい値を超える前に管理者へアラートを送信。
