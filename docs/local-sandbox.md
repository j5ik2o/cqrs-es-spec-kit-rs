# ローカルサンドボックス環境

本ドキュメントでは、LocalStack・MySQL・Redis を利用したローカル検証環境の構築手順と、Rust 製 Lambda（イベントフォワーダー／リードモデル更新サービス）のデプロイ方法をまとめる。

## 1. 前提ツール
- Docker / Docker Compose v2 以上
- Python `awscli-local` (`pip install awscli-local`)
- Rust toolchain (stable 1.80+ を推奨)
- `cargo-lambda` (`curl -sSf https://github.com/cargo-lambda/cargo-lambda/releases/latest/download/cargo-lambda-installer.sh | sh`)
- make（任意）

## 2. コンポーネント構成
- `docker-compose.local.yml`  
  - `localstack/localstack:2.3`（DynamoDB, DynamoDB Streams, Kinesis, Lambda, IAM, CloudWatch Logs 等）  
  - `mysql:8.0`（リードモデル DB）  
  - `redis:7`（通知基盤）
- `scripts/localstack/bootstrap.sh`  
  - DynamoDB テーブルと Kinesis ストリーム、Secrets Manager の初期化を実施
- `scripts/localstack/deploy-lambdas.sh`  
  - `cargo lambda build` で ZIP を生成し、LocalStack 上の Lambda にデプロイ

## 3. 起動手順
```bash
# LocalStack / MySQL / Redis を起動
docker compose -f docker-compose.local.yml up -d localstack mysql redis

# リソース初期化（テーブル・ストリーム・シークレット）
AWS_REGION=ap-northeast-1 scripts/localstack/bootstrap.sh
```

## 4. Lambda のビルドとデプロイ

### 4.1 ZIP パッケージ（標準）
```bash
# 例: イベントフォワーダーをリリースビルドし LocalStack へ配置
LAMBDA_NAME=event-forwarder scripts/localstack/deploy-lambdas.sh

# 例: リードモデル更新サービス
LAMBDA_NAME=read-model-updater scripts/localstack/deploy-lambdas.sh
```
- Lambda ロール ARN は LocalStack ではダミーでよい (`arn:aws:iam::000000000000:role/lambda-ex`)。必要に応じて `awslocal iam create-role` で作成する。
- `cargo lambda build --release --target x86_64-unknown-linux-gnu --bin <lambda>` が内部で実行され、成果物は `target/lambda/<lambda>/bootstrap.zip` に出力される。

### 4.2 コンテナイメージ (Optional)
LocalStack の Lambda はコンテナイメージでもデプロイできる。

```bash
cargo lambda build --release --bin event-forwarder --output-format docker

awslocal lambda create-function \
  --function-name event-forwarder-image \
  --package-type Image \
  --code ImageUri=local/event-forwarder:latest \
  --role arn:aws:iam::000000000000:role/lambda-ex
```

> `--output-format docker` で `local/<lambda>:latest` イメージが生成される。LocalStack はホストの Docker デーモンを参照するため、`docker tag` で名前を付けてから `awslocal lambda create-function` を実行する。

## 5. テスト補助コマンド

- DynamoDB テーブルの状況確認  
  `awslocal dynamodb scan --table-name cqrs-es-event-store`
- Kinesis ストリームのレコード取得  
  `awslocal kinesis get-shard-iterator --stream-name cqrs-es-events --shard-id shardId-000000000000 --shard-iterator-type TRIM_HORIZON`
- Lambda 実行ログ  
  `awslocal logs tail /aws/lambda/event-forwarder --follow`

## 6. 終了
```bash
docker compose -f docker-compose.local.yml down
```
永続データ（LocalStack, MySQL, Redis）はボリュームに保存される。クリーンアップしたい場合は `docker compose -f docker-compose.local.yml down -v` を使う。
