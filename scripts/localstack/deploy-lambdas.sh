#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
LAMBDA_NAME="${LAMBDA_NAME:-event-forwarder}"
ROLE_ARN="arn:aws:iam::000000000000:role/lambda-ex"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
TARGET="${TARGET:-x86_64-unknown-linux-gnu}"

if ! command -v cargo-lambda >/dev/null 2>&1; then
  echo "cargo-lambda がインストールされていません。" >&2
  echo "https://github.com/cargo-lambda/cargo-lambda を参照してインストールしてください。" >&2
  exit 1
fi
if ! command -v awslocal >/dev/null 2>&1; then
  echo "awslocal コマンドが見つかりません。pip で awscli-local をインストールしてください。" >&2
  exit 1
fi

ARTIFACT_DIR="${ROOT_DIR}/target/lambda/${LAMBDA_NAME}"

echo "==> Lambda 関数 (${LAMBDA_NAME}) をビルドします"
cargo lambda build --release \
  --target "${TARGET}" \
  --output-format zip \
  --bin "${LAMBDA_NAME}"

ZIP_PATH="${ARTIFACT_DIR}/bootstrap.zip"
if [[ ! -f "${ZIP_PATH}" ]]; then
  echo "Lambda アーティファクトが見つかりません: ${ZIP_PATH}" >&2
  exit 1
fi

if awslocal lambda get-function --function-name "${LAMBDA_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1; then
  echo "==> 既存 Lambda (${LAMBDA_NAME}) を更新します"
  awslocal lambda update-function-code \
    --function-name "${LAMBDA_NAME}" \
    --zip-file "fileb://${ZIP_PATH}" \
    --region "${AWS_REGION}" >/dev/null
else
  echo "==> 新しい Lambda (${LAMBDA_NAME}) を作成します"
  awslocal lambda create-function \
    --function-name "${LAMBDA_NAME}" \
    --runtime provided.al2 \
    --handler bootstrap \
    --zip-file "fileb://${ZIP_PATH}" \
    --role "${ROLE_ARN}" \
    --environment "Variables={AWS_REGION=${AWS_REGION}}" \
    --timeout 30 \
    --memory-size 512 \
    --region "${AWS_REGION}" >/dev/null
fi

echo "Lambda デプロイが完了しました。"
