# クイックスタート: ユーザ管理機能

## 前提条件

- Rust ツールチェーン: `rustc 1.90.0`（`rustup component add rustfmt clippy` を実行）
- Cargo Make: `cargo install cargo-make`（`makers` エイリアス利用を推奨）
- Node.js 20 LTS（Next.js BFF／UI 用）
- Docker / Docker Compose v2
- AWS CLI v2（LocalStack 用のダミープロファイル設定）
- openssl, pkg-config（SQLx, Argon2 ビルドに必要）

## 初期セットアップ

```bash
git clone <repo-url>
cd cqrs-es-spec-kit-rs
cargo make init           # ツールチェーン検証と git hooks 設定（後続で実装）
cargo make install-tools  # sqlx-cli / just / wasm-bindgen などを導入予定
```

### 環境変数

1. `.env.local` をルートに作成し、`common.env.example`（後続追加）をコピー。
2. `AWS_ACCESS_KEY_ID=localstack`, `AWS_SECRET_ACCESS_KEY=localstack`, `AWS_REGION=ap-northeast-1` を設定。
3. `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` を開発用に指定（例: `dev_user`）。

## ローカル実行フロー

1. **インフラ起動**
   ```bash
   cargo make localstack-up
   # => docker-compose.local.yml で LocalStack + MySQL + MailHog + DynamoDB Local を起動
   ```

2. **スキーマ適用**
   ```bash
   cargo make migrate
   # => refinery + sqlx で Aurora/MySQL スキーマをローカル DB へ適用
   ```

3. **シード/テストデータ投入（任意）**
   ```bash
   cargo make localstack-seed
   # => ダミーユーザとメールテンプレートを LocalStack に登録
   ```

4. **GraphQL サーバ起動**
   ```bash
   cargo make run-write-api
   # applications/write-api-server が localhost:8080/graphql を公開
   ```

5. **Read Model Updater（Lambda 相当）**
   ```bash
   cargo make run-rmu-local
   # Kinesis -> Lambda -> MySQL のパイプラインをローカルで模擬
   ```

6. **BFF / UI（frontend/next-app）**
   ```bash
   cd frontend/next-app
   npm install
   npm run dev  # Next.js API Routes が :3000 で GraphQL BFF として動作
   ```

7. **GraphQL Playground**
   - `http://localhost:8080/graphql` にアクセスし、`viewer` クエリなどを送信。
   - セッション系 Mutation は BFF API 経由で実行し、Cookie 設定を確認。

## テスト

- ドメイン/ユースケース: `cargo test --package modules-command-domain`
- インフラ統合: `cargo test --package modules-command-interface-adaptor-impl`
- LocalStack E2E: `cargo make e2e`
- Lint/Format: `cargo fmt --all && cargo clippy --all-targets --workspace`

## トラブルシュート

- LocalStack 起動が不安定な場合は `cargo make localstack-clean` でボリュームを削除。
- MySQL への接続が失敗する場合は `scripts/localstack/status.sh`（後続追加）でヘルスチェック。
- GraphQL レスポンスに `UNAUTHORIZED` が返る場合は BFF 側のセッション Cookie 設定を確認。`signIn` 後に `Set-Cookie: sessionId` が返っているかをチェックする。

## 今後の TODO

- `cargo make` タスク群と `docker-compose.local.yml` の整備
- サンプル BFF（Next.js）との接続ガイド補完
- LocalStack での SES テンプレート投入スクリプト
