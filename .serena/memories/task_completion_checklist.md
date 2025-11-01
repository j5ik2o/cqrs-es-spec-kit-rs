# タスク完了時のチェックリスト

タスク（機能実装・バグ修正・リファクタリング）完了時に実行する必須手順。

## 1. コード品質チェック
### フォーマット
```bash
cargo fmt -- --check
```
- ❌ エラーが出た場合: `cargo fmt` で自動修正してからコミット

### Clippy 警告
```bash
cargo clippy --all-targets --all-features -- -D warnings
```
- ❌ 警告が出た場合: コード修正または `#[allow(clippy::...)]` で正当化

## 2. テスト実行
### ユニットテスト
```bash
cargo test
```
- ✅ すべて PASSED であることを確認

### 統合テスト（LocalStack 環境起動後）
```bash
# 環境起動
docker compose -f docker-compose.yml up -d

# E2E テスト実行
cargo test --test integration_tests
```
- ✅ すべて PASSED であることを確認
- ❌ 失敗した場合: ローカルサンドボックスのログを確認

## 3. ドキュメント同期確認
### 仕様書
- [ ] `specs/` の該当仕様書が実装と一致しているか確認
- [ ] 変更があった場合は仕様書を同時更新

### 計画書・タスク
- [ ] `plan-template.md` の技術調査結果を反映
- [ ] `tasks-template.md` の該当タスクを完了状態に更新

### 憲章遵守
- [ ] `.specify/memory/constitution.md` の制約に違反していないか確認
- [ ] アーキテクチャ境界（ドメイン → ユースケース → アダプタ → インフラ）を遵守

## 4. コミットメッセージ
```bash
git add .
git commit -m "<仕様ID>: <ユースケース名> - <変更概要>

<詳細>
- 変更理由
- 影響範囲
- 関連ドキュメント更新
"
```
- ✅ 仕様 ID とユースケース名を必ず含める

## 5. LocalStack 検証（Lambda 変更時）
```bash
# Lambda 再デプロイ
LAMBDA_NAME=<lambda-name> scripts/localstack/deploy-lambdas.sh

# ログ確認
awslocal logs tail /aws/lambda/<lambda-name> --follow

# 手動呼び出しテスト
awslocal lambda invoke --function-name <lambda-name> output.json
cat output.json
```
- ✅ ログにエラーがないこと
- ✅ 期待通りの出力が得られること

## 6. PR 作成前の最終確認
- [ ] すべてのテストが PASSED
- [ ] Clippy 警告ゼロ
- [ ] フォーマット違反なし
- [ ] ドキュメント更新済み
- [ ] ローカル E2E テスト成功
- [ ] コミットメッセージに仕様 ID 記載

## 緊急時のスキップ可能項目
**原則として以下はスキップ不可。例外は仕様で合意が必要。**
- ❌ テスト実行をスキップ
- ❌ Clippy 警告を無視
- ❌ ドキュメント更新を後回し

## トラブルシューティング
### テスト失敗時
1. ローカル環境のログ確認: `awslocal logs tail`
2. DynamoDB・Kinesis の状態確認: `awslocal dynamodb scan`, `awslocal kinesis describe-stream`
3. 環境リセット: `docker compose -f docker-compose.yml down -v && docker compose -f docker-compose.yml up -d`

### Clippy 警告解消できない場合
1. 警告の正当性を検討
2. 正当な理由がある場合のみ `#[allow(clippy::...)]` を追加
3. 理由をコメントで明記
