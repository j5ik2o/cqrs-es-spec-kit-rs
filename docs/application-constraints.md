# アプリケーション共通制約

本ドキュメントは、CQRS/ES システムの具体的な要件に依存しない恒常的な技術制約をまとめる。個別機能の要件やユースケース仕様は `specs/` 配下で管理し、本書ではアーキテクチャ全体に共通する守るべきルールを定義する。

## 1. アーキテクチャ境界
- **サービス分離**: コマンドアプリケーションサービス（イベントソーシングを担う Rust サービス）と GraphQL BFF、Next.js フロントエンドは必ず独立デプロイとする。BFF はコマンドのビジネスロジックを保持せず、サービス間通信越しにユースケースを呼び出す。
- **依存方向**: ドメイン層 → ユースケース層 → インターフェースアダプタ層 → インフラストラクチャ層の依存を遵守する。ドメイン層から外部ライブラリやインフラ詳細への直接依存は禁止。
- **API 統一**: フロントエンドとの契約は GraphQL (Query / Mutation / Subscription) に統一し、BFF から外部サービスへのプロトコル変更が生じてもフロント契約を変えない。

## 2. イベントストアおよびメッセージング
- **イベントストア**: DynamoDB + DynamoDB Streams を必須とし、`references/event-store-adapter-rs` に準拠した構成・バージョニング・スナップショット戦略を適用する。
- **イベント転送**: DynamoDB Streams → Lambda（イベントフォワーダー）→ Kinesis → Lambda（リードモデル更新サービス）→ MySQL リードモデルの多段構成を採用し、順序保証・再試行ポリシーを実装する。構成の変更加筆は仕様変更扱いとする。
- **通知基盤**: ライブ更新は Redis Pub/Sub もしくは Streams（LocalStack では redis:7）を利用可能とし、BFF Subscription が購読する。別基盤を採用する際は仕様で合意を得る。

## 3. データストアとリードモデル
- **リードモデル DB**: MySQL 8 系を標準とし、投影単位でスキーマを分離。アクセスパターンを BFF GraphQL Query に合わせて設計する。
- **冪等性**: リードモデル更新サービスはイベント ID を処理履歴テーブルで管理し、再投影やリプレイ時に重複反映を許容しない。
- **接続形態**: Lambda から MySQL への接続は RDS Proxy / Connection Pool を経由すること。ローカル環境では `mysql:8.0` コンテナを利用する。

## 4. BFF とフロントエンド
- **BFF の役割**: 認証／認可・監査ログ・GraphQL スキーマ管理・エラーハンドリング・Subscription 配信を担う。イベント整合性や集約操作はコマンドサービス側で完結させる。
- **Next.js**: RSC/Server Actions/クライアントコンポーネントはすべて BFF の GraphQL を経由し、MySQL やコマンドサービスに直接アクセスしない。OIDC/OAuth のトークン連携は BFF のコンテキストへ集約する。

## 5. Lambda 実装基準
- **使用ライブラリ**: `lambda_runtime`, `aws_lambda_events`, `aws-sdk-*`, `tracing` を標準とする。ビルドは `cargo-lambda` を利用し、成果物は ZIP 形式（必要に応じて Docker イメージ）で配布する。
- **イベントフォワーダー**: DynamoDB Streams イベントを受け取り、Kinesis へ `PutRecords` で転送する。シーケンス番号をパーティションキーに利用し、失敗レコードの再試行を実装する。
- **リードモデル更新サービス**: Kinesis イベントを処理し、MySQL を更新する。`mysql_async` または `sqlx` を用いて RDS Proxy 経由で接続し、処理済みイベントを追跡する。
- **ログ・監視**: Lambda すべてで構造化ログ（`tracing`）を出力し、CloudWatch Logs や LocalStack の Logs サービスで監視可能とする。

## 6. ローカルサンドボックス
- `docker-compose.local.yml` に定義された LocalStack・MySQL・Redis を使用する。LocalStack の Lambda 実行モードは `docker-reuse` とし、ホスト Docker を利用する。
- 初期化は `scripts/localstack/bootstrap.sh`、Lambda デプロイは `scripts/localstack/deploy-lambdas.sh` を使用する。詳細手順は `docs/local-sandbox.md` に従う。
- LocalStack 上での IAM ロールはダミー ARN を許容するが、本番相当のポリシー構成を再現できるよう `awslocal iam` コマンドで作成する。

## 7. セキュリティ・運用制約
- すべてのサービス間通信は TLS 前提。本番では IAM ロールの最小権限・Secrets Manager による資格管理を必須とし、LocalStack でも同 API でモックする。
- 監査ログ・アクセスログ・イベント処理ログは SIEM へ統合可能なフォーマットで出力し、BFF と Lambda の双方でコリレーション ID を付与する。
- フェイルオーバー: DynamoDB Streams 停止時は Lambda の再試行を待ち、Kinesis 障害時は DLQ／再投入バッチを設ける。設計変更は仕様で協議する。

## 8. ドキュメントとテスト
- `specs/` の要件、`plan-template.md`、`tasks-template.md` を常に同期し、実装差異を許容しない。重大な制約変更は OpenSpec の提案により承認を得る。
- テストはドメイン単体・ユースケース・イベントフォワーダー・RMU の各層で自動化し、ローカルサンドボックス上の E2E を CI/CD に組み込む。
- GraphQL スキーマのバージョン管理と破壊的変更の告知手順を定め、フロントエンドとの契約を明確化する。

## 9. 今後の確認事項
- GraphQL Subscription のイベント粒度とペイロード標準化
- Redis 以外の通知基盤（EventBridge, MQ 等）を採用する場合の互換ポリシー
- マルチテナント／RBAC/ABAC の追加要件
- OpenTelemetry などの分散トレーシング対応範囲
