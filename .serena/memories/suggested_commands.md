# 推奨コマンド一覧

## ローカル環境セットアップ
```bash
# LocalStack・MySQL・Redis 起動
docker compose -f docker-compose.yml up -d localstack mysql redis

# DynamoDB テーブル・Kinesis ストリーム・Secrets 初期化
AWS_REGION=ap-northeast-1 scripts/localstack/bootstrap.sh

# Lambda デプロイ（イベントフォワーダー）
LAMBDA_NAME=event-forwarder scripts/localstack/deploy-lambdas.sh

# Lambda デプロイ（リードモデル更新サービス）
LAMBDA_NAME=read-model-updater scripts/localstack/deploy-lambdas.sh
```

## コードフォーマットとリント
```bash
# フォーマット実行
cargo fmt

# フォーマットチェック（CI 用）
cargo fmt -- --check

# Clippy 警告チェック
cargo clippy -- -D warnings

# すべてのワークスペースで Clippy 実行
cargo clippy --all-targets --all-features -- -D warnings
```

## テスト実行
```bash
# すべてのユニットテスト実行
cargo test

# 統合テスト実行
cargo test --test '*'

# 特定のテストのみ実行
cargo test test_create_user

# テストカバレッジ（tarpaulin 使用時）
cargo tarpaulin --out Html --output-dir coverage
```

## ビルド
```bash
# デバッグビルド
cargo build

# リリースビルド
cargo build --release

# Lambda 用ビルド（ZIP）
cargo lambda build --release --bin <lambda-name>

# Lambda 用ビルド（Docker イメージ）
cargo lambda build --release --bin <lambda-name> --output-format docker
```

## LocalStack 操作コマンド
```bash
# DynamoDB テーブル確認
awslocal dynamodb list-tables

# DynamoDB レコードスキャン
awslocal dynamodb scan --table-name cqrs-es-event-store

# Kinesis ストリーム確認
awslocal kinesis list-streams

# Lambda 関数一覧
awslocal lambda list-functions

# Lambda ログ確認
awslocal logs tail /aws/lambda/event-forwarder --follow

# Lambda 呼び出しテスト
awslocal lambda invoke --function-name event-forwarder output.json
```

## 環境クリーンアップ
```bash
# Docker Compose 停止（データ保持）
docker compose -f docker-compose.yml down

# Docker Compose 停止（ボリューム削除）
docker compose -f docker-compose.yml down -v

# ビルド成果物削除
cargo clean
```

## タスク完了時の必須コマンド
```bash
# 1. フォーマットチェック
cargo fmt -- --check

# 2. Clippy 警告チェック
cargo clippy --all-targets --all-features -- -D warnings

# 3. すべてのテスト実行
cargo test

# 4. LocalStack E2E テスト（環境起動後）
cargo test --test integration_tests
```

## Git 操作
```bash
# ブランチ作成（機能開発）
git checkout -b feature/<仕様ID>-<短い説明>

# コミット（仕様 ID 必須）
git commit -m "<仕様ID>: <ユースケース名> - <変更概要>"

# 変更確認
git status
git diff
git log --oneline -10
```

## Darwin（macOS）特有のユーティリティ
```bash
# ファイル検索
find . -name "*.rs" -type f

# パターン検索
grep -r "pattern" src/

# ディレクトリ一覧
ls -la

# プロセス確認
ps aux | grep rust

# ネットワーク確認
lsof -i :4566  # LocalStack
lsof -i :3306  # MySQL
lsof -i :6379  # Redis
```
