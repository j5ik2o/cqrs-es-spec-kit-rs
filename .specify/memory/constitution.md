<!--
Sync Impact Report
Version change: 1.15.1 → 1.15.2
Modified principles:
- ドメイン中心アーキテクチャ（ガバナンス手順の表現を更新）
- ドキュメントとテスト（仕様提案フローの表現を更新）
Added sections:
- なし
Removed sections:
- なし
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ✅ openspec/project.md
Follow-up TODOs:
- なし
-->
# DDD Base with Spec JS 憲章

## Core Principles

### ドメイン中心アーキテクチャ
- MUST ドメイン層はエンティティ・値オブジェクト・ドメインサービスで構成し、ビジネスルールをこの層に集約する。
- MUST ユースケース層は公開ポートを介してのみドメイン層へ依存し、外部実装や UI 依存を侵入させない。
- MUST インターフェースアダプタ層はユースケースを境界として外部入出力を調整し、依存方向を「インターフェースアダプタ → ユースケース → ドメイン」のみとする。
- MUST サービス分離を徹底し、コマンドアプリケーションサービス・Rust GraphQL BFF・Next.js フロントエンドは独立デプロイで運用する。BFF はビジネスロジックを保持せず、サービス間通信越しにユースケースを呼び出す。
- MUST フロントエンドとの契約は GraphQL (Query / Mutation / Subscription) に統一し、BFF が内部サービスとのプロトコル変更を吸収しても契約を改変しない。
理由: 層境界とサービス分離を守ることで、変更の影響を局所化しつつスケール要件の異なる CQRS/ES コンポーネントを安定運用できる。

### 仕様駆動の意思決定
- MUST 新規・変更作業は `/specs/` 配下の仕様書を作成・合意してから着手する。
- MUST 仕様書にはユースケース、受入条件、ドメイン影響、制約、エラー分類を明記し、変更時は同時に更新する。
- MUST 憲章違反が疑われる要求は仕様段階で議論し、合意が得られるまで実装を進めない。
理由: 仕様先行で利害関係者とユビキタス言語を同期し、後戻りコストを抑制する。

### ユースケース単位のモジュール性
- MUST 各ユースケースは専用のアプリケーションサービスで実装し、他ユースケースへ直接依存しない。
- MUST 集約の生成・状態変更はユースケース層を経由させ、副作用とイベントを追跡できるようにする。
- MUST イベントソーシングの再生とスナップショット戦略をユースケース境界に紐付け、テストで検証する。
理由: ユースケース境界を守ることで変更の波及を限定し、コマンド処理の一貫性を担保する。

### テストファースト検証
- MUST ドメイン層・ユースケース層の自動テストを実装前に記述し、失敗を確認してからコードを書く。
- MUST コマンド→イベント→投影の流れを統合テストで覆い、イベント再生とリードモデル復元を継続的に検証する。
- MUST エラーハンドリングは回復可能性を明示した戻り値型で表現し、テストで分岐を網羅する。
理由: テスト駆動で境界を具現化し、仕様逸脱を早期に検出する。

### ドキュメント同期と追跡性
- MUST `plan-template.md`・`tasks-template.md`・`spec-template.md` に基づく成果物を最新化し、実装との乖離を禁止する。
- MUST コミット・PR には対応する仕様 ID とユースケース名を明記し、履歴から判断できるようにする。
- MUST ローカルサンドボックス（`docs/local-sandbox.md`）と本憲章の制約を照合し、検証手順の更新を同時に反映する。
理由: ドキュメントと実装を同期させることで知識の属人化と再作業を抑制する。

## 追加技術制約
- MUST コマンドアプリケーションサービスは DynamoDB をイベントストアとし、`references/event-store-adapter-rs` に準拠したスキーマ、スナップショット、バージョニング戦略を適用する。
- MUST DynamoDB Streams → Lambda（イベントフォワーダー）→ Kinesis → Lambda（リードモデル更新サービス）→ MySQL リードモデルの多段構成を採用し、順序保証・再試行ポリシーを実装する。構成変更は仕様変更として議論・合意する。
- MUST GraphQL BFF は Query/Mutation/Subscription を単一スキーマで提供し、内部サービスとのプロトコル変更を吸収する。BFF は GraphQL 契約と認可・監査ロジックに専念し、集約操作は必ず委譲する。
- MUST Next.js フロントエンドは常に BFF 経由でデータアクセス・コマンド実行を行い、MySQL やコマンドサービスへ直接接続しない。
- MUST リードモデル DB は MySQL 8 系を標準とし、投影単位でスキーマを分離し、GraphQL Query のアクセスパターンを基に最適化する。
- MUST ライブ更新は Redis Pub/Sub または Streams を経由し、BFF Subscription で配信する。別基盤を採用する場合は仕様で明示し合意を得る。
- MUST Lambda 実装は `lambda_runtime` / `aws_lambda_events` / `aws-sdk-*` / `tracing` を標準とし、`cargo-lambda` によるビルド成果物（ZIP またはコンテナイメージ）で配布する。
- MUST リードモデル更新サービスは `mysql_async` または `sqlx` を用い、RDS Proxy などの接続プールを介して MySQL へ接続し、イベント ID に基づく冪等性を保証する。

## ローカルサンドボックス
- MUST `docker-compose.yml` に定義された LocalStack・MySQL・Redis を使用してローカル検証を行う。LocalStack の Lambda 実行モードは `docker-reuse` とする。
- MUST `scripts/localstack/bootstrap.sh` で DynamoDB テーブル・Kinesis ストリーム・Secrets を初期化し、`scripts/localstack/deploy-lambdas.sh` で Lambda（イベントフォワーダー／リードモデル更新サービス）をデプロイする。
- MUST ローカル検証手順の詳細は `docs/local-sandbox.md` に従い、更新が発生した場合は本憲章と同時に同期する。

## セキュリティ・運用制約
- MUST すべてのサービス間通信を TLS 前提とし、本番では IAM ロールの最小権限と Secrets Manager による資格管理を適用する。LocalStack では同 API を用いてモックする。
- MUST 監査ログ・アクセスログ・イベント処理ログを SIEM へ統合可能なフォーマットで出力し、BFF と Lambda の双方でコリレーション ID を付与する。
- MUST DynamoDB Streams 停止時は Lambda の再試行を待ち、Kinesis 障害時は DLQ または再投入バッチで復旧する計画を持つ。設計変更は仕様で合意する。

## ドキュメントとテスト
- MUST `specs/` の要件、`plan-template.md`、`tasks-template.md` を常に同期し、実装差異を許容しない。重大な制約変更は仕様提案（例: `openspec/changes/<id>/`）で承認を得る。
- MUST ドメイン単体・ユースケース・イベントフォワーダー・リードモデル更新サービスを自動テストし、ローカルサンドボックスでの E2E テストを CI/CD に組み込む。
- MUST GraphQL スキーマのバージョン管理と破壊的変更の告知方針を定め、フロントエンドとの契約を明確化する。

## 開発ワークフロー
1. 仕様策定: `spec-template.md` を用いてユースケース・受入基準・ドメイン影響・制約を定義し、合意を得る。
2. 計画立案: `plan-template.md` で技術調査・ユースケース分解・リスク評価を行い、依存関係や LocalStack 検証を計画に明記する。
3. タスク分解: `tasks-template.md` を用いてユースケース単位の実装／テストタスクを列挙し、並列実行可否と完了条件を設定する。
4. 実装・検証: テストファーストで実装し、ローカルサンドボックス（`docker-compose.yml`）上でイベントフォワーダー／RMU／BFF の E2E を確認する。
5. レビュー・同期: PR レビューでは本憲章と仕様の両立を確認し、必要なドキュメント・手順を更新してからマージする。

## Governance
- 憲章は開発・運用プロセスに最優先で適用され、矛盾するガイドラインを上書きする。
- 変更は仕様管理リポジトリの提案で理由・影響・テンプレート更新計画を提示し、承認を得るまで実装を開始しない。
- バージョン管理はセマンティックバージョニングを採用する（破壊的変更=MAJOR、原則追加=MINOR、文言整理=PATCH）。
- 四半期ごとと主要リリース前に憲章遵守レビューを実施し、違反が判明した場合は是正計画と期限を記録する。
- ローカルサンドボックスやテンプレートが更新された場合は本憲章へ反映し、整合性チェックを必須とする。

**Version**: 1.15.2 | **Ratified**: 2025-10-31 | **Last Amended**: 2025-11-01
