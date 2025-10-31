# 実装計画: ユーザ管理機能の初期提供

**ブランチ**: `001-add-user-management` | **日付**: 2025-10-31 | **仕様**: `specs/001-add-user-management/spec.md`  
**入力**: `specs/001-add-user-management/spec.md` のフィーチャ仕様

**メモ**: `/speckit.plan` コマンドが本テンプレートを出力する。運用手順はリポジトリのドキュメントで最新状態を確認する。

## サマリー

メールアドレスとパスワードによるアカウント登録・メール認証・ログインおよびログアウト、プロフィールと通知設定の編集を Rust 製 CQRS / Event Sourcing 基盤で提供する。DynamoDB をイベントストアとして用い、Kinesis 経由でリードモデルを更新し、SES による認証メール送信と S3 でのアバター保管を前提に、LocalStack + docker compose でエンドツーエンド検証を整備する初期リリースである。

## 技術コンテキスト

**使用言語 / バージョン**: Rust 2024 edition（`rustc 1.90.0` stable + `rustfmt`/`clippy` を `rust-toolchain.toml` で固定）  
**主要依存関係**: `event-store-adapter-rs`, `async-graphql`, `async-graphql-axum`, `axum`, `tokio`, `aws-sdk-dynamodb`/`-streams`/`-ses`/`-s3`, `sqlx`（MySQL）, `refinery`, `testcontainers`, `tracing`, `opentelemetry`  
**ストレージ**: DynamoDB（ジャーナル/スナップショット/セッション）、S3（アバター格納）、Aurora MySQL 互換 DB（リードモデル）、SES（メール送信リンク）、Kinesis Data Streams（イベント転送）  
**テスト基盤**: `cargo test` + `serial_test` によるドメイン/ユースケース TDD、`testcontainers` による DynamoDB Local / MySQL 統合テスト、LocalStack + docker compose を用いた E2E (`cargo make e2e`)  
**対象プラットフォーム**: AWS Fargate（GraphQL サーバ）、AWS Lambda（Read Model Updater / Event Forwarder）、Next.js BFF（Vercel 想定）、LocalStack を用いたローカル検証環境  
**プロジェクト種別**: Rust Cargo ワークスペースによるモノレポ（modules + applications サブクレート構成）  
**性能目標**: SC-001（サインアップ+認証 5 分以内 80%）、SC-002（プロフィール編集 10 秒以内 90%）、SC-003（再ログイン時プロフィール/設定維持率 95%）、SC-004（サポート問い合わせ週 5 件未満）を計測し改善ループを回す  
**制約**: DynamoDB + `event-store-adapter-rs` 構成を遵守し、Kinesis → Lambda → MySQL 投影チェーンと SES/S3 連携を LocalStack でも再現する。BFF 経由の GraphQL アクセスと監査ログ出力を必須とする。  
**規模・スコープ**: 初期ローンチはベータユーザ 10,000 名規模を想定し、日次アクティブ 3,000 名を耐えうるスループットを目標（GraphQL QPS 50 程度）  
**フロント/BFF/GraphQL**: Rust GraphQL サーバ（async-graphql）を単一境界として提供し、Next.js API Routes が専用フェッチャーを通じてアクセス。RSC は共有トークンモジュール経由でサーバに直結し、ブラウザは必ず BFF を経由する。  
**永続化/投影**: コマンド側は DynamoDB イベントストア + スナップショット (50 イベント間隔)、Kinesis 経由で Read Model Updater(Lambda) が Aurora MySQL を更新。MySQL スキーマは `refinery` 管理、GraphQL クエリは MySQL から直接読み取る。  
**ワークスペース/パッケージ**: `references/cqrs-es-example-rs` を基準に `modules/command|query|rmu|infrastructure` と `applications/write-api-server|read-model-updater|read-api-server` をワークスペースメンバーに追加し、CI で逆依存検出を有効化する。

## 憲章準拠チェック

*ゲート条件: フェーズ0（リサーチ）着手前とフェーズ1（設計）完了時に必ず確認する。*

- ✅ ドメイン中心アーキテクチャ: Cargo workspace 化とモジュール分割を `ワークスペースと層構造` セクションで定義し、依存方向のルールを明文化済み。
- ✅ 仕様駆動の意思決定: `specs/001-add-user-management/spec.md` にユーザーストーリー・受入基準・制約が揃っており、計画が準拠。
- ✅ ユースケース単位のモジュール性: `ドメインモデル開発計画` に各ユースケースのサービス分割と順序を定義済み。
- ✅ テストファースト検証: `テスト基盤` 記述と `ドメインモデル開発計画` により、TDD と統合テストの手順を策定済み。
- ✅ ドキュメント同期と追跡性: `ドキュメント同期フロー` で openspec 検証・PR 手順と更新ルールを整備。
- ✅ ドメインモデル開発手順: 憲章要求の順序を `ユースケース分割と開発順序` で具体化。
- ✅ クリーンアーキテクチャ構造: `レイヤー責務確認` と `リポジトリ構成` で各層の責務と依存制御を規定。
- ✅ CQRS/Event Sourcing: イベントスキーマ・DynamoDB・Kinesis 設計を `CQRS/Event Sourcing 設計` に整理済み。
- ✅ エラーハンドリング戦略: `エラーハンドリング計画` に Result/例外境界とコード命名規則を定義。
- ✅ クラウド基盤とローカル検証: `quickstart.md` と `永続化と投影設計` で LocalStack・docker-compose 手順を整備。
- ✅ プレゼンテーションと BFF: `プレゼンテーションと BFF 設計` で Next.js API Routes と GraphQL の責務分担を定義。
- ✅ 永続化ストアとリードモデル: DynamoDB + Aurora MySQL 構成を `永続化と投影設計` に明記。
- ✅ パッケージ構成と依存制御: Cargo workspace での依存ガードと CI 手順を `リポジトリ構成と依存制御` で策定。
- ✅ GraphQL アクセス方針: BFF/API Routes 経由のアクセスルールと RSC 例外条件を `プレゼンテーションと BFF 設計` に定義。

**ゲート評価**: フェーズ0リサーチとフェーズ1設計により、憲章項目はすべて計画段階でクリア済み。追加のクリアランスは不要で、フェーズ2タスク定義へ進める準備が整った。

## プロジェクト構成

### ドキュメント（このフィーチャ）

```text
specs/001-add-user-management/
├── plan.md         # 実装計画
├── research.md     # フェーズ0 調査結果
├── data-model.md   # ドメイン/リードモデル設計
├── quickstart.md   # ローカル検証手順
├── contracts/      # GraphQL スキーマ等の契約
└── tasks.md        # フェーズ2で作成する実装タスク一覧
```

### ソースコード（リポジトリルート想定）

```text
Cargo.toml
modules/
├── command/
│   ├── domain/
│   ├── processor/
│   ├── interface-adaptor-if/
│   └── interface-adaptor-impl/
├── query/
│   └── interface-adaptor/
├── rmu/
└── infrastructure/
applications/
├── write-api-server/
├── read-model-updater/
└── read-api-server/
frontend/
└── next-app/               # Next.js アプリケーション（app router）
    ├── app/                # UI (RSC) と API Routes(BFF) を同一プロジェクトで管理
    │   ├── api/            # GraphQL BFF エンドポイント（/api/graphql など）
    │   └── (routes...)     # ユーザホーム、設定 UI
    ├── lib/                # BFF 向け GraphQL クライアント、セッション管理
    ├── public/             # 静的アセット
    └── package.json
scripts/
├── localstack/
└── migration/
tests/
├── unit/
├── contract/
└── integration/
```

**構成方針**: Rust Cargo ワークスペースで層を分離し、`references/cqrs-es-example-rs` と同等の依存階層を保持する。BFF/UI は別ワークスペースまたはサブディレクトリで管理し、GraphQL 契約を共有パッケージとして配布する。

## ドメインモデル開発計画

1. **ドメインテスト**: `modules/command/domain` に `UserAccount` の状態遷移テスト、`EmailAddress`/`PasswordCredential` バリデーション、`Profile`/`Settings` 更新の不変条件テストを `serial_test`・`rstest` で先行作成。ロックアウト・トークン期限切れ・セッション上限をカバーする。
2. **モデル実装**: テスト駆動で値オブジェクトを実装し、`UserAccount` 集約がイベントを返す形でコマンドを処理する。Primitive Obsession を避け、ID/メール/トークン/セッションを専用型で保持する。
3. **バリデーション方針**: 値オブジェクトの `try_from` 実装で検証し、失敗時は `DomainError::Validation` を返す。ドメインサービスでは追加バリデーションを行わず、ユースケース層で組み合わせる。
4. **リファクタリング**: 各イベント適用ロジックの重複を排除し、`apply_*` メソッドを内製。命名は仕様のユビキタス言語（SignUp/Verify/SessionIssued 等）に合わせる。
5. **インメモリリポジトリ**: `modules/command/interface-adaptor-if` にポートを定義し、`modules/infrastructure` でインメモリ実装を用意。ドメインテスト・ユースケーステスト両方で利用できるよう ID 生成を注入可能にする。
6. **ユースケース実装**: `SignUpService` → `VerifyEmailService` → `SignInService` → `ProfileService` → `SettingsService` の順に実装。各サービスはポート (`UserAccountRepository`, `MailSender`, `SessionStore`, `FileStorage`) に依存し、Result 型でエラー分類を行う。
7. **アダプタ実装**: DynamoDB リポジトリ → SES メール送信 → S3 アップロードサイン → GraphQL リゾルバ → Kinesis Publisher の順で実装。BFF クライアントは contracts から生成したフェッチャーを利用。
8. **統合・結合テスト**: `testcontainers` で DynamoDB Local / MySQL コンテナを起動し、`cargo make e2e` で SignUp→Verify→SignIn→ProfileUpdate のシナリオを GraphQL 経由で検証。LocalStack で Lambda (RMU) の動作も確認する。

## エラーハンドリング計画

- **回復可能エラー**: ドメイン層 `DomainError`（検証失敗・状態遷移不可・重複メール）、ユースケース層 `ApplicationError`（メール送信失敗・ストレージ障害）を `Result<T, Error>` で返却。メール送信は 3 回リトライ後に通知キューへ、S3/SES の一時失敗は指数バックオフ。
- **回復不能エラー**: `panic!` は型不一致などの内部不整合のみ。インフラ層で `anyhow` を受けた場合は `tracing::error!` とアラート送信（PagerDuty/CloudWatch）。
- **例外変換方針**: AWS SDK のエラーを `match` で分類し、再試行可能なものは `ApplicationError::Transient`, 永続的なものは `ApplicationError::Permanent` に変換。GraphQL レイヤではエラーコード (`SIGNUP_DUPLICATED_EMAIL` 等) を拡張フィールドで返す。
- **命名規則**: `*Error` サフィックスを付け、責務ごとに `SignUpError`, `AuthError`, `ProfileError` を定義。GraphQL で公開するコードも同名に合わせ、BFF で定型処理可能にする。

## CQRS/Event Sourcing 設計

- **コマンドモデル**: `UserAccount` 集約が `sign_up`, `verify`, `sign_in`, `sign_out`, `update_profile`, `update_settings` メソッドを公開し、ユースケースサービスから直接呼び出す。整合性制約（メール重複、セッション上限、ロック状態）は集約内で検証。コマンドオブジェクトは作らず、メソッド引数に値オブジェクトを渡す。
- **クエリモデル**: MySQL ベースの `user_home_view` / `user_accounts` / `user_profiles` / `user_settings` / `user_sessions` テーブルから `async-graphql` の resolver が直接読み取り、ドメインモデルを再利用しない。最終的整合性（Kinesis→MySQL 投影）は 1〜2 秒のラグを許容し、GraphQL レイヤで `pendingVerification` などを返して差分を吸収。
- **イベントスキーマ**: JSON 構造に `schema_version` を付与。初期バージョンは `1`。`AccountCreated`, `AccountVerified`, `SessionIssued`, `ProfileUpdated`, `SettingsUpdated`, `VerificationTokenResent` を定義。将来のアップキャストは Lambda でのバージョン分岐で対応する。
- **イベントストア構成**: `event-store-adapter-rs` を利用し `journal` / `snapshot` テーブルを DynamoDB に用意。パーティションキーは `aggregate_id`（ULID）、ソートキーは `sequence_nr`。スナップショット間隔は 50。AWS IAM ロールは書き込み/読み取り別権限を設定。
- **イベントバス**: `AccountEventStream` (Kinesis) を 1 シャードで開始（初期 QPS < 10）。パーティションキーは `aggregate_id`、サブスクリプションは `read-model-updater` Lambda と将来の通知サービス。LocalStack では `kinesis-mock` を docker compose で起動する。
- **運用・テスト**: リプレイ CLI (`cargo run -p applications/read-api-server -- replay --user <id>`) を用意。障害時は DynamoDB からイベント再読込し、MySQL を truncate → 投影し直す手順を quickstart に記載。負荷試験は `k6` で GraphQL Mutation を 50req/s → 100req/s で実行し、Kinesis ラグをモニタリングする。

## プレゼンテーションと BFF 設計

- **GraphQL サーバ**: `async-graphql` にて Mutation をユースケースと 1:1 にマッピング（`signUp`, `verifyEmail`, `signIn`, `signOut`, `updateProfile`, `updateSettings`, `requestAvatarUpload`). Query は `viewer`, `accountStatus`。ドメイン層は GraphQL から直接呼ばず、ユースケースサービス経由。
- **BFF (Next.js API Routes)**: `@/contracts/bff-client` から生成した fetcher を使用。`/api/auth/*` でセッション Cookie を管理（`HttpOnly`, `Secure`, `SameSite=Lax`）。入力検証は `zod` で実施し、GraphQL エラーコードを HTTP 422/401 にマッピング。監査ログは CloudWatch Logs へ転送。
- **BFF (Next.js API Routes)**: `frontend/next-app` 配下に配置し、`@/contracts/bff-client` から生成した fetcher を使用。`/api/auth/*` でセッション Cookie を管理（`HttpOnly`, `Secure`, `SameSite=Lax`）。入力検証は `zod` で実施し、GraphQL エラーコードを HTTP 422/401 にマッピング。監査ログは CloudWatch Logs へ転送。
- **Next.js UI**: 認証のあるページは RSC + Route Handlers でデータ取得。ブラウザ側は API Routes 経由のみ。プロフィール編集は CSR フォーム + Mutation 呼び出し。通知は将来の SSE/GraphQL Subscription の導入余地を残す。
- **エラーハンドリング**: BFF 層でドメインエラーコードを i18n メッセージキーに変換し、UI へ JSON で返却。重大エラーは Sentry と CloudWatch に二重送信。
- **監視・計測**: GraphQL サーバは `tracing` + OpenTelemetry でメトリクスを出力し、BFF は Next.js Middleware で request span を発行。両者の trace-id を連携させる。
- **アクセスポリシー**: クライアントコンポーネントは API Routes 経由のみ。RSC は `lib/graphql-server-client` を使用して直接アクセス可能だが、API Routes と同じクライアント設定を共有し、監査ログを必ず記録する。

## 永続化と投影設計

- **コマンド永続化**: DynamoDB テーブル `journal`（PK: `aggregate_id`, SK: `sequence_nr`）、`snapshot`（PK: `aggregate_id`, SK: `seq_nr`）、`verification_tokens`（PK: `token_value`）、`sessions`（PK: `session_id` + TTL）。RCU/WCU は初期 5 で開始し、自動スケーリングを設定。IAM ポリシーは最小権限で分離。
- **イベントストア**: `event-store-adapter-rs` に DynamoDB クライアントを注入し、スナップショット間隔 50、イベント保存時に Kinesis へフォワード。LocalStack では `aws --endpoint-url` を用い初期化スクリプトを実行。
- **リードモデル**: Aurora MySQL (serverless v2) を採用。マイグレーションは `refinery` + `sqlx-cli migrate run`。接続プールは `sqlx::mysql::MySqlPool`（max_connections=10）。インデックス構成は `data-model.md` に従う。
- **Read Model Updater**: Rust Lambda (`lambda_runtime` + `aws-sdk-kinesis`) が Kinesis ストリームをトリガ。失敗時は 3 回リトライ後に Dead Letter Queue (SQS) へ送信。デプロイは `cargo lambda` or `cargo make deploy-rmu` を整備。
- **ローカル/CI**: `docker-compose.local.yml` で LocalStack, MySQL, MailHog を起動。Lambda は `cargo make run-rmu-local` でローカルバイナリを起動し、Kinesis Mock からイベントを取得。CI では GitHub Actions 上で同手順を実行。
- **監視/運用**: DynamoDB (ConsumedCapacity, Throttle), Kinesis (IteratorAge), Lambda (Duration/Errors), MySQL (Connections/SlowQueries) を CloudWatch + Datadog に連携。コストアラートは AWS Budgets で月額 100 USD を閾値設定。
- **テーブルフォーマット**: `references/event-store-adapter-rs/docs/DATABASE_SCHEMA.md` を参照し、`journal` は `payload` JSON / `metadata` JSON / `version` / `occurred_at` を格納する。差分は `aggregate_type = 'UserAccount'` を追加予定。

## リポジトリ構成と依存制御

- **ワークスペース管理**: ルート `Cargo.toml` で `members` を定義し、`cargo metadata` による依存解析を CI で実行。`cargo make check-deps` を用意し、不要依存を検出。
- **パッケージ構造**: `modules/command/domain`, `modules/command/processor`, `modules/command/interface-adaptor-if`, `modules/command/interface-adaptor-impl`, `modules/query/interface-adaptor`, `modules/rmu`, `modules/infrastructure`, `applications/write-api-server`, `applications/read-model-updater`, `applications/read-api-server` をメンバーに追加。
- **依存ルール**: `command/domain` は外向き依存ゼロ。`processor` は `domain` とポートインターフェイスのみに依存。`interface-adaptor-impl` は `processor` と `interface-adaptor-if` に依存可能。`query` は `rmu` から発行されるスキーマのみ共有し、逆依存禁止。`cargo deny` や `dephell` 相当のチェックを導入。
- **ビルドガード**: `cargo hakari` で依存を整理し、`cargo make ci` で `cargo check --workspace --all-targets`, `cargo fmt --check`, `cargo clippy` を実行。逆依存が検出された場合は CI を失敗させるスクリプトを追加。
- **ドキュメント化**: `README.md` にワークスペース図と依存ルールを掲載。差異が出た場合は `plan.md` の「リポジトリ構成」節を更新し、PR で参照を求める。

## リファレンス資産の活用

- **イベントストア実装**: `references/event-store-adapter-rs` の `docs/DATABASE_SCHEMA.md` と `examples/dynamodb_event_store.rs` を参照。コードコピーは行わず、設定値とリトライ戦略のみ取り込む。
- **CQRS サンプル**: `references/cqrs-es-example-rs` の `modules/command` / `modules/query` / `applications/read-model-updater` を設計リファレンスとし、差異（ユーザドメイン固有のフィールド等）は plan/data-model に明記。
- **ライセンス対応**: 参照コードは MIT/Apache-2.0 互換。引用箇所はコメントで出典を明示し、COPYRIGHT はルートの NOTICE へ追記する。
- **レビュー観点**: PR テンプレートに「参照したリファレンスパス」と「差異の根拠」を追加し、レビュアーが意図を追跡できるようにする。

## 複雑性トラッキング

現時点で憲章違反となる複雑性追加は計画していない。今後例外が発生した場合は本節に理由と代替案を記載する。
## レイヤー責務確認

- **ドメイン層**: `modules/command/domain` に `UserAccount` 集約と `EmailAddress` 等の値オブジェクトを配置。外部依存を一切持たず、イベント発生と不変条件チェックのみを実装。
- **ユースケース層**: `modules/command/processor` に `SignUpService`, `VerifyEmailService`, `SignInService`, `ProfileService`, `SettingsService` を配置。依存するポートは `UserAccountRepository`, `MailGateway`, `SessionStore`, `FileStorage`, `ReadModelPublisher`。
- **インターフェースアダプタ層**: `modules/command/interface-adaptor-impl` に DynamoDB リポジトリ、SES メール送信、S3 ファイルストア、GraphQL リゾルバを配置。DTO 変換を担当し、ユースケース層の戻り値を GraphQL ペイロードにマッピングする。
- **インフラストラクチャ層**: `modules/infrastructure` に設定読み込み、ULID 生成、トレーシング、環境差異対応のユーティリティを配置。IO を伴う処理は含めず、実装はすべてインターフェースアダプタ層で行う。
