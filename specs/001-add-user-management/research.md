# フェーズ0 リサーチ

## リサーチタスク

- Task: "Research Rust toolchain version for user management feature"
- Task: "Research workspace layering for cqrs-es-spec-kit-rs user management"
- Task: "Research application service split and development order for user management"
- Task: "Research async GraphQL stack for Rust CQRS user management"
- Task: "Research Next.js BFF to Rust GraphQL integration for user management"
- Task: "Research read model storage selection for user management projections"
- Task: "Research testing frameworks for Rust CQRS/Event Sourcing user management"
- Task: "Research event-store-adapter-rs best practices for DynamoDB user management"
- Task: "Research error handling strategy for Rust CQRS/Event Sourcing user management"
- Task: "Research LocalStack bootstrap workflow for AWS-backed user management"
- Task: "Research observability metrics for user management success criteria"
- Task: "Research documentation sync workflow for user management feature"

## 調査結果

### Rust ツールチェーン
- Decision: `rustc 1.90.0` の stable チャンネルを明示した `rust-toolchain.toml` を追加し、必須コンポーネントに `rustfmt` と `clippy` を含める。
- Rationale: 2025-10-31 時点のローカル環境と一致し、参照リポジトリ（`references/cqrs-es-example-rs`）も stable 運用であるため、バージョン差異によるビルド不整合を避けられる。
- Alternatives considered: `nightly`（破壊的変更リスクが高く再現性が下がるため不採用）、ツールチェーン未固定（CI/LocalStack 双方での再現性が失われるため不採用）。

### ワークスペースと層構造
- Decision: Cargo workspace を導入し、`modules/command/*`, `modules/query/*`, `modules/rmu`, `modules/infrastructure`, `applications/*` を参照例と同じ構成で配置し、依存方向を一方向（interface-adaptor → processor → domain）に固定する。
- Rationale: 憲章のクリーンアーキテクチャ要件を満たし、`references/cqrs-es-example-rs/Cargo.toml` の構成を再利用することで逆依存検知を Cargo レベルで実現できる。
- Alternatives considered: 単一クレート内でモジュール分割（依存方向を Cargo が検証できず憲章違反リスクが高いため不採用）、サブモジュールごとの別リポジトリ化（ビルド/テストコストが増加し初期スコープに合わないため不採用）。

### ユースケース分割と開発順序
- Decision: サインアップ、認証、サインイン/サインアウト、プロフィール更新、設定更新の各ユースケースごとに `*Service`（processor クレート）を定義し、開発順序は「ドメインテスト → ドメイン実装 → インメモリリポジトリ → アプリケーションサービス → インターフェースアダプタ（GraphQL リゾルバ/リポジトリ実装）→ Read Model Updater → BFF 契約」の順で統一する。
- Rationale: 憲章のドメインモデル開発手順とユースケース単位モジュール性の両方を満たし、イベントソーシングの再現性を保ったまま段階的に検証できる。
- Alternatives considered: 垂直スライス実装で UI から順に開発（ドメインテストが後回しになり憲章違反になるため不採用）、ドメインとユースケースを同一モジュールにまとめる（責務が混在するため不採用）。

### GraphQL スタック
- Decision: `async-graphql` + `async-graphql-axum` を採用し、`axum` ベースの GraphQL エンドポイントを `applications/write-api-server` に配置する。ランタイムは `tokio` を使用する。
- Rationale: 参照実装で実績があり、非同期 GraphQL 実装として成熟している。Rust エコシステムでのコラボレーションが豊富で、BFF/API Routes からの HTTP アクセスにも適合する。
- Alternatives considered: `juniper`（開発が停滞気味で最新 Rust 特性対応が遅い）、`warp` + `juniper`（既存資産と整合せず、学習コスト増のため不採用）。

### BFF / GraphQL アクセス方針
- Decision: Next.js 側は API Routes で GraphQL クライアント (`contracts/bff-client` に生成する fetcher) をラップし、ブラウザからは必ず API Routes 経由で Mutation/Query を実行する。React Server Components は共有トークンモジュールを介して直接 GraphQL を叩くことを許容するが、同一クライアント実装と監査ログ設定を再利用する。
- Rationale: 憲章のプレゼンテーション/BFF 原則に従い、セッション管理と入力検証を BFF に集約できる。GraphQL スキーマは当リポジトリ側で管理し、BFF は契約に従うのみとする。
- Alternatives considered: Next.js から GraphQL へ直接アクセス（セッション・監査が分散し憲章違反）、gRPC や REST を新設（契約が増え初期機能に対し過剰）。

### リードモデル永続化
- Decision: 本番は Aurora MySQL（互換: MySQL 8.x）を使用し、ローカルは docker compose 上の MySQL コンテナを利用する。Rust 側は `sqlx` + `refinery` でスキーマ管理し、Read Model Updater（Lambda）が Kinesis イベントを消費して MySQL を更新する。
- Rationale: 参照例と同じ構成であり、複雑な集計/検索に強いリレーショナルモデルを活かせる。`sqlx` のオフラインモードでスキーマ検証できる。
- Alternatives considered: DynamoDB での投影（複雑クエリに不利で UI 要件を満たしにくい）、PostgreSQL（Aurora 互換性や既存ノウハウを考慮し優先度低）。

### テスト基盤
- Decision: ドメイン/ユースケースは `cargo test` と `serial_test` で TDD を実施し、イベントストア・リードモデルは `testcontainers` を用いた統合テストで DynamoDB Local / MySQL コンテナを起動する。AWS サービス統合は LocalStack を docker compose で立ち上げ、E2E は `cargo make e2e`（新設）コマンドにまとめる。
- Rationale: Rust 標準テストとコンテナ型統合テストで高速かつ再現性のある検証が可能。LocalStack 連携により CI でも AWS 依存を再現できる。
- Alternatives considered: 実 AWS リソースを使った手動検証（コストと危険が大きい）、`aws-sdk` のモックみでユニットテストのみ行う（エンドツーエンド検証が不足）。

### Event Store / バージョニング
- Decision: `event-store-adapter-rs` を利用し、ジャーナル/スナップショットテーブルをリファレンスどおり構築する。スナップショット間隔は仕様どおり 50 イベント。イベントには `version` と `occurred_at` を含め、アップキャスト策略は JSON payload の `schema_version` で管理する。トークン再送は adapter の再試行機構を利用し、SES 再送を別途記録する。
- Rationale: 既存ライブラリの運用実績と DynamoDB 最適化が活かせる。バージョン番号保持により後方互換変更を管理できる。
- Alternatives considered: 独自実装（工数増加と品質リスク）、EventStoreDB など他ストア（インフラ新設が必要）。

### エラーハンドリング戦略
- Decision: ドメイン層では `thiserror` で型付きエラーを定義し `Result<T, DomainError>` を返す。ユースケース層では回復可能エラーを `Result` 相当の enum で分類し、インフラ層では `anyhow` で受けてログ後にアプリケーションエラーへ変換する。GraphQL には `async-graphql` の拡張を用いてエラーコードをマッピングする。
- Rationale: 憲章の回復可能/不能エラー区別を明文化でき、UI へ適切なメッセージを返せる。
- Alternatives considered: `panic!` に依存（回復不能と回復可能の区別がつかない）、汎用 `String` エラー（トレース不十分）。

### LocalStack / Quickstart
- Decision: `docker-compose.local.yml` を新設し、LocalStack・MySQL・MailHog（メール確認用）・DynamoDB Local を起動する。`scripts/localstack/bootstrap.sh` でテーブル/バケット/SES 設定を自動化し、`cargo make localstack-up` で一括起動、`cargo make localstack-seed` でサンプルデータ投入を行う。
- Rationale: 新規開発者が `cargo make localstack-up` → `cargo make e2e` の 2 コマンドで主要フローを再生できるようにするため。
- Alternatives considered: 個別スクリプトを手動実行（手順が煩雑で onboarding 速度が落ちる）、AWS 本番環境共有（コストと権限管理が複雑）。

### 観測指標と性能目標
- Decision: `tracing` + `opentelemetry` を導入し、GraphQL リクエストとユースケース単位の span を計測する。SC-001〜SC-004 の指標に対応するメトリクス（サインアップ完了時間、プロフィール更新反映時間、セッション更新率）をダッシュボード化する。
- Rationale: 定量指標を計測しないと成功条件の達成可否が判断できない。OpenTelemetry は Rust/Next.js 双方で互換があり、将来の AWS X-Ray 連携も容易。
- Alternatives considered: ログのみ（計測が手動になり正確性が低い）、独自メトリクス実装（保守コストが高い）。

### ドキュメント同期フロー
- Decision: `plan.md`・`research.md`・`data-model.md`・`quickstart.md`・`contracts/` を更新した際は `openspec validate --strict` を CI に組み込み、PR では `specs/001-add-user-management/tasks.md` を Phase 2 で生成してリンクする。各ドキュメントの更新履歴に仕様 ID を記録し、BFF 連携ドキュメントも同パスで管理する。
- Rationale: 憲章のドキュメント同期要件を満たし、仕様と実装ドキュメントの乖離を防止する。
- Alternatives considered: 手動確認のみ（漏れのリスクが高い）、別リポジトリ管理（管理コストが増える）。
