# 技術スタック詳細

## 言語とツールチェーン
- **Rust**: edition 2024
  - Cargo: 1.90.0+
  - rustfmt: 1.8.0+
  - clippy: 0.1.90+
- **Node.js**: Next.js フロントエンド用（バージョンは BFF プロジェクトで管理）

## コア依存ライブラリ（Lambda）
- `lambda_runtime` - AWS Lambda Rust ランタイム
- `aws_lambda_events` - Lambda イベント型定義
- `aws-sdk-dynamodb`, `aws-sdk-kinesis` - AWS SDK
- `tracing` - 構造化ログ
- `mysql_async` または `sqlx` - MySQL 接続（リードモデル更新サービス）
- `cargo-lambda` - Lambda ビルド・デプロイツール

## インフラストラクチャ
### 本番環境
- **イベントストア**: DynamoDB
- **イベントストリーム**: DynamoDB Streams
- **メッセージング**: AWS Kinesis
- **リードモデル DB**: MySQL 8 (RDS)
- **通知**: Redis Pub/Sub または Streams
- **Lambda 実行**: AWS Lambda (Rust custom runtime)
- **認証**: IAM ロール + Secrets Manager
- **ログ**: CloudWatch Logs

### ローカル環境（LocalStack）
- **docker-compose.yml** 構成:
  - `localstack/localstack:2.3` - DynamoDB, Streams, Kinesis, Lambda, IAM, CloudWatch Logs
  - `mysql:8.0` - リードモデル DB
  - `redis:7` - 通知基盤
- Lambda 実行モード: `docker-reuse`（ホスト Docker 利用）

## ビルドツール
- `cargo` - Rust パッケージマネージャ
- `cargo-lambda` - Lambda 専用ビルドツール
  - ZIP パッケージ生成
  - Docker イメージ生成（オプション）
  - ターゲット: `x86_64-unknown-linux-gnu`

## 開発補助ツール
- `awscli-local` (`awslocal`) - LocalStack 操作用 AWS CLI ラッパー
- Python 3.x - `awslocal` 実行用
- Docker / Docker Compose v2+
- make（オプション）

## リファレンス実装
- `references/event-store-adapter-rs` - イベントストア設計の参照実装
  - DynamoDB スキーマ
  - スナップショット戦略
  - バージョニング
