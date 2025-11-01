# プロジェクト概要

## プロジェクト名
cqrs-es-spec-kit-rs

## プロジェクトの目的
Rust を用いた CQRS/Event Sourcing システムのリファレンス実装およびベースキット。DDD（ドメイン駆動設計）と仕様駆動開発を組み合わせ、以下を実現する:

1. **CQRS パターン**: コマンド（書き込み）とクエリ（読み取り）を分離し、イベントソーシングでドメインイベントを永続化
2. **マイクロサービス構成**: 
   - コマンドアプリケーションサービス（Rust + DynamoDB イベントストア）
   - GraphQL BFF（Rust、認可・監査・スキーマ管理）
   - Next.js フロントエンド（GraphQL クライアント）
3. **仕様駆動開発**: 実装前に仕様を定義し、ドキュメントと実装を同期
4. **ローカルサンドボックス**: LocalStack・MySQL・Redis によるフルスタック検証環境

## アーキテクチャの核心原則
- **ドメイン中心**: ビジネスルールをドメイン層に集約し、インフラ依存を排除
- **層分離**: ドメイン → ユースケース → インターフェースアダプタ → インフラの依存方向を遵守
- **イベント駆動**: DynamoDB → Lambda → Kinesis → リードモデル（MySQL）の非同期更新パイプライン
- **GraphQL 契約統一**: フロントエンドと BFF の契約を安定化し、内部変更を吸収

## 主要テクノロジースタック
- **言語**: Rust (edition 2024)
- **イベントストア**: DynamoDB + DynamoDB Streams
- **メッセージング**: AWS Kinesis
- **リードモデル DB**: MySQL 8
- **通知基盤**: Redis Pub/Sub
- **Lambda ランタイム**: `lambda_runtime`, `aws_lambda_events`, `cargo-lambda`
- **BFF**: Rust GraphQL サーバー
- **フロントエンド**: Next.js (GraphQL クライアント)
- **ローカル環境**: LocalStack, Docker Compose

## 開発哲学
- 仕様先行（`specs/` 配下での合意後に実装）
- テストファースト（ドメイン・ユースケース層の自動テスト）
- ドキュメント同期（`plan-template.md`, `spec-template.md`, `tasks-template.md` の厳格な更新）
- 憲章遵守（`.specify/memory/constitution.md` を最優先ガイドライン）
