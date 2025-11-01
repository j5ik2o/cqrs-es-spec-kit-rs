#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"

if ! command -v awslocal >/dev/null 2>&1; then
  echo "awslocal コマンドが見つかりません。pip で awscli-local をインストールしてください。" >&2
  exit 1
fi

AWS_REGION="${AWS_REGION:-ap-northeast-1}"
STREAM_NAME="${STREAM_NAME:-cqrs-es-events}"
DDB_TABLE="${DDB_TABLE:-cqrs-es-event-store}"

echo "==> DynamoDB テーブルを作成します: ${DDB_TABLE}"
awslocal dynamodb create-table \
  --table-name "${DDB_TABLE}" \
  --attribute-definitions AttributeName=aggregate_id,AttributeType=S AttributeName=sequence_number,AttributeType=N \
  --key-schema AttributeName=aggregate_id,KeyType=HASH AttributeName=sequence_number,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region "${AWS_REGION}" >/dev/null

echo "==> Kinesis ストリームを作成します: ${STREAM_NAME}"
awslocal kinesis create-stream \
  --stream-name "${STREAM_NAME}" \
  --shard-count 1 \
  --region "${AWS_REGION}" >/dev/null

echo "==> Secrets Manager にデータベース資格情報を投入します"
awslocal secretsmanager create-secret \
  --name cqrs-es/read-model-db \
  --secret-string "{\"username\":\"read_model_user\",\"password\":\"read_model_pass\",\"host\":\"mysql\",\"port\":3306,\"database\":\"read_model\"}" \
  --region "${AWS_REGION}" >/dev/null

echo "初期化が完了しました。"
