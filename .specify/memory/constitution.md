<!-- Sync Impact Report
バージョン: 1.0.0 → 1.1.0
更新した原則:
- DDD集約境界の厳守 → DDD集約境界の厳守（サービス分離と依存方向の明文化を追記）
- イベントストア標準化とDynamoDB運用 → イベントストア標準化とDynamoDB運用（パイプライン/通知基盤の詳細を追記）
- CQRSとGraphQL契約の一貫性 → CQRSとGraphQL契約の一貫性（BFF/Next.js の責務と契約維持を追記）
- ローカルサンドボックス整合性 → ローカルサンドボックス整合性（docker-reuse や awslocal 運用を明記）
- OpenSpecドキュメント同期と品質ゲート → OpenSpecドキュメント同期と品質ゲート（サービス分離確認を追加）
追加セクション:
- 技術・インフラ要件（アーキテクチャ境界・イベントストア・データストア・BFF・Lambda・ローカルサンドボックス詳細）
削除セクション: なし
テンプレート更新状況:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
フォローアップ: なし
-->

# CQRS/ES Spec Kit for Rust 憲章

## Core Principles

### DDD集約境界の厳守
- MUST 集約ごとにアグリゲートルートを定義し、境界外からの状態遷移で不変条件が破壊されないようコマンド処理を閉じ込める。
- MUST ドメイン層→ユースケース層→インターフェースアダプタ層→インフラ層の依存方向を維持し、ドメイン層から外部ライブラリ・インフラ詳細への直接依存を禁止する。
- MUST コマンド処理は必ずドメインサービスまたは集約が生成するドメインイベントに変換し、副作用はユースケース層で制御する。
理由: DDDの境界を守ることでイベントソーシングの一貫性を確保し、集約のテスト容易性と変更耐性を最大化できる。

### イベントストア標準化とDynamoDB運用
- MUST `event-store-adapter-rs` を用い、DynamoDBのジャーナル／スナップショットテーブル構成・バージョニング戦略をサンプル準拠で維持する。
- MUST DynamoDB Streams→Lambda（イベントフォワーダー）→Kinesis→Lambda（リードモデル更新）→MySQL のパイプラインを基準構成とし、順序保証と再試行ポリシーを設計・ドキュメント化する。
- MUST ライブ通知経路（Redis Pub/Sub または Streams）を BFF Subscription に連携させ、別基盤採用時は仕様変更として合意を得る。
- MUST スナップショットとイベント永続化のリトライ／整合性チェックをリポジトリ層で自動化し、破損検出時は復旧手順をドキュメント化する。
理由: 標準化されたイベントストア運用により、読みモデルとの整合性と障害復旧時間を制御可能にする。

### CQRSとGraphQL契約の一貫性
- MUST コマンドサービス、GraphQL BFF、Next.js フロントエンドを独立デプロイとし、BFF がコマンドのビジネスロジックを保持しない構造を維持する。
- MUST フロントとの契約を GraphQL Query/Mutation/Subscription に統一し、BFF から外部サービスへのプロトコル変更があってもフロント契約を破壊しない。
- MUST Next.js の RSC/Server Actions/クライアントコンポーネントは常に BFF GraphQL を経由し、MySQL やコマンドサービスへ直接アクセスしない。
- MUST BFF は認証／認可・監査ログ・GraphQL スキーマ管理・エラーハンドリング・Subscription 配信を担い、イベント整合性や集約操作はコマンドサービスで完結させる。
理由: CQRS分離とGraphQL契約を固定することで、書き込みと読み取りのスケーラビリティおよびフロント契約の安定性を両立させる。

### ローカルサンドボックス整合性
- MUST `docker-compose.local.yml` で LocalStack・MySQL・Redis を起動し、Lambda 実行モードを `docker-reuse` に設定してホスト Docker を活用する。
- MUST `scripts/localstack/bootstrap.sh` と `scripts/localstack/deploy-lambdas.sh` を用いてリソース初期化と Lambda デプロイを行い、CIでも同手順で検証する。
- MUST LocalStack 上で IAM ロールや秘密情報を `awslocal` CLI で整備し、本番相当のポリシー構成との差分をドキュメント化する。
理由: ローカルサンドボックスの整合性を保つことでデプロイ前の不具合検出率を最大化し、本番リスクを低減する。

### OpenSpecドキュメント同期と品質ゲート
- MUST すべての機能追加は OpenSpec の proposal → plan → spec → tasks の順序で策定し、未承認のまま実装を開始しない。
- MUST plan/spec/tasks 間でユーザーストーリー・要件・タスクが一対一に追跡できることを Constitution Check で確認する。
- MUST 主要イベントフロー・GraphQL 契約・リードモデル更新はテスト戦略（ユニット／契約／E2E）を定義し、CI に組み込む。
理由: ドキュメント同期と品質ゲートを強制することで、仕様逸脱と実装ドリフトを未然に防ぐ。

## 技術・インフラ要件

本プロジェクトは DynamoDB をイベントストア、Kinesis をストリーム処理、MySQL をリードモデルとして運用する。以下を遵守すること。

- **アーキテクチャ境界**
  - コマンドアプリケーションサービス（Rust）、GraphQL BFF、Next.js フロントエンドは必ず独立デプロイとし、サービス間通信越しにユースケースを呼び出す。
  - 依存方向はドメイン層 → ユースケース層 → インターフェースアダプタ層 → インフラ層に限定し、ドメイン層から外部ライブラリやインフラ詳細へ直接依存しない。
  - フロントエンドとの契約は常に GraphQL に統一し、BFF 内でのプロトコル変化やバックエンド差し替えで契約破壊を起こさない。
- **イベントストアとメッセージング**
  - DynamoDB + DynamoDB Streams を必須構成とし、`references/event-store-adapter-rs` のサンプルに準じたテーブル設計・スナップショット戦略を採用する。
  - DynamoDB Streams → Lambda（イベントフォワーダー）→ Kinesis → Lambda（リードモデル更新）→ MySQL の経路を標準とし、順序保証・再試行ポリシー・障害時復旧手順を明文化する。
  - ライブ更新は Redis Pub/Sub もしくは Redis Streams（LocalStack では `redis:7`）を使用し、代替基盤を採用する場合は仕様変更として合意を得る。
- **データストアとリードモデル**
  - リードモデル DB は MySQL 8 系を標準とし、投影単位でスキーマを分割する。アクセスパターンは GraphQL Query に合わせて設計する。
  - リードモデル更新サービスはイベント ID の処理履歴で冪等性を保証し、再投影・リプレイで重複反映を防止する。
  - Lambda から MySQL への接続は必ず RDS Proxy もしくはコネクションプール経由とし、ローカル環境では `mysql:8.0` コンテナを利用する。
- **BFF とフロントエンド**
  - BFF は認証／認可、監査ログ、GraphQL スキーマ管理、エラーハンドリング、Subscription 配信を担い、イベント整合性や集約操作はコマンドサービス側で完結させる。
  - Next.js の RSC・Server Actions・クライアントコンポーネントはすべて BFF の GraphQL を経由し、バックエンドへの直接アクセスは禁止する。
  - OIDC/OAuth のトークン連携は BFF のコンテキストに集約し、クライアントからの資格情報を直接バックエンドへ渡さない。
- **Lambda 実装基準**
  - `lambda_runtime`, `aws_lambda_events`, `aws-sdk-*`, `tracing` を標準ライブラリとし、ビルドは `cargo-lambda` を用いて ZIP（必要時は Docker イメージ）を生成する。
  - イベントフォワーダーは DynamoDB Streams を受信し、Kinesis へ `PutRecords` で転送する。シーケンス番号をパーティションキーに利用し、失敗レコードの再試行を実装する。
  - リードモデル更新サービスは Kinesis イベントから MySQL を更新し、`mysql_async` または `sqlx` を用いて RDS Proxy 経由で接続、処理済みイベントを追跡・記録する。
  - すべての Lambda は構造化ログ（`tracing`）を出力し、CloudWatch Logs や LocalStack Logs で監視できる状態を維持する。
- **ローカルサンドボックス**
  - `docker-compose.local.yml` に定義された LocalStack・MySQL・Redis を使用し、ホットリロードやリスタート手順を docs/local-sandbox.md に従って管理する。
  - 初期化は `scripts/localstack/bootstrap.sh`、Lambda デプロイは `scripts/localstack/deploy-lambdas.sh` を必ず利用する。
  - LocalStack 上での IAM ロールはダミー ARN を許容するが、本番相当のポリシー構成を `awslocal iam` コマンドで再現し、差分は記録する。

- 監視は `tracing` による構造化ログを CloudWatch/LocalStack Logs へ出力し、相関IDでトレース可能とする。
- すべてのサービス間通信は TLS 前提、Secrets Manager で資格情報を管理し、Least Privilege を徹底する。

## 開発ワークフローと品質ゲート

- OpenSpec に基づき、plan.md の Constitution Check で DDD境界、サービス分離、イベントストア構成、GraphQL スキーマ、サンドボックス手順、ドキュメント整合性を検証し、未回答があれば実装を開始しない。
- spec.md はユーザーストーリーを優先度付きで定義し、各ストーリーは独立してテスト可能とする。Edge Case とエラーシナリオを必ず明記する。
- tasks.md はユーザーストーリー単位でタスクを分割し、Foundational フェーズ完了前にストーリー着手しない。テストタスクは書いて失敗させてから実装する。
- ローカルおよび CI で `cargo test`, `cargo lambda build`, LocalStack での E2E を実施し、失敗を許容しない。
- 重大な制約変更やインフラ改修は OpenSpec の proposal を通じてレビューし、合意前の実装は禁止する。

## Governance

- この憲章はプロジェクト内の全ドキュメント／テンプレートより優先する。矛盾がある場合は憲章に従うよう更新する。
- 改訂は OpenSpec の proposal で議論し、承認後に憲章と関連テンプレートを同期する。破壊的変更はメジャーバージョンを更新し、履歴を記録する。
- コンスティテューションのバージョニング: 原則の追加・大幅改訂は MINOR 以上、ガバナンスルール変更や原則削除は MAJOR、文言整理のみは PATCH とする。
- 改訂時は Ratified 日付を初版から維持し、Last Amended を更新する。変更差分と影響範囲を Sync Impact Report に必ず記載する。
- 全ての PR/レビューで憲章順守を確認し、違反が見つかった場合はブロックして是正計画を提示する。

**Version**: 1.1.0 | **Ratified**: 2025-11-01 | **Last Amended**: 2025-11-01
