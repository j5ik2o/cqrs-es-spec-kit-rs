# Implementation Plan: ユーザ管理基盤初期構築

**Branch**: `001-init-user-management` | **Date**: 2025-11-01 | **Spec**: [spec.md](./spec.md)
**Input**: `/specs/001-init-user-management/spec.md` の機能仕様

**メモ**: このテンプレートは `/speckit.plan` コマンドによって自動生成・更新される。運用手順は `.specify/templates/commands/plan.md` またはプロジェクトドキュメントを参照すること。

## Summary

初期リリースに必要なユーザ管理機能として、セルフサインアップ、メール認証後のプロフィール閲覧、利用者自身による退会、管理者によるユーザ状態監視と制御、通知・監査ログ整備を提供する。Next.js フロントエンドでは利用者向けモジュールと管理者向けモジュールを分離し、GraphQL BFF 経由で Rust のコマンドサービスへコマンドを発行し DynamoDB イベントストアと MySQL 読みモデルの整合を保つ。

## Technical Context

**Language/Version**: Rust 1.80 系（コマンドサービス）、TypeScript 5.x + Next.js 15（フロント/管理UI）  
**Primary Dependencies**: event-store-adapter-rs, async-graphql, sqlx, AWS SES (メール通知), NextAuth.js (セッション管理)  
**Storage**: DynamoDB（イベントストア）、MySQL（読みモデル）、Redis Streams（リアルタイム通知）  
**Testing**: cargo test、cargo lambda build、docker-compose.local.yml による LocalStack 統合テスト、Next.js コンポーネントテスト (Playwright)  
**Target Platform**: AWS ECS (Fargate) 上の GraphQL BFF / Next.js アプリ、AWS Lambda (イベントフォワーダー/リードモデル更新)  
**Project Type**: CQRS コマンドサービス + GraphQL BFF + Next.js Web アプリ（利用者/管理者モジュール）  
**Performance Goals**: メール認証完了まで平均 10 分以内、退会処理完了通知が 5 分以内、管理者操作反映が 1 分以内  
**Constraints**: DDD 集約境界の維持、イベントストアの単一集約ストリーム化、メールアドレス重複禁止、アクセス制御のモジュール分離、GraphQL スキーマ後方互換性  
**Scale/Scope**: 初期ローンチ時点でアクティブユーザ 10,000 名以下、同時管理者 50 名以下、通知スループット毎時 2,000 件想定

## Constitution Check

*ゲート: フェーズ0（リサーチ）開始前に必ず全項目を確認し、フェーズ1（設計）終了時に再確認する。未チェック項目がある場合、実装に進んではならない。*

- [x] DDD境界: ユーザ集約でサインアップ/退会を完結させ、BFF・Next.js はコマンド発行と読み取りに限定する設計とする。
- [x] イベントストア: 既定の DynamoDB + Lambda → Kinesis → Lambda → MySQL パイプラインと Redis 通知を前提とし、逸脱しない。
- [x] CQRS/GraphQL契約: GraphQL Mutation を通じてコマンドを発行し、Next.js は BFF 以外へ直接アクセスしない構成を維持する。
- [x] サンドボックス: LocalStack + docker-compose.local.yml による再現環境と Lambda デプロイ手順、ECS 相当のアプリ実行を踏襲する。
- [x] ドキュメント同期: proposal → plan → spec → tasks の順を守り、テスト戦略と CI ゲートを計画に含めて同期する。

## Project Structure

### Documentation (this feature)

```text
specs/001-init-user-management/
├── plan.md              # このファイル (/speckit.plan 出力)
├── research.md          # フェーズ0 (/speckit.plan 出力)
├── data-model.md        # フェーズ1 (/speckit.plan 出力)
├── quickstart.md        # フェーズ1 (/speckit.plan 出力)
├── contracts/           # フェーズ1 (/speckit.plan 出力)
└── tasks.md             # フェーズ2 (/speckit.tasks 出力)
```

### Source Code (repository root)

```text
/src
├── domain
│   └── user
├── application
│   ├── commands
│   └── queries
├── infrastructure
│   ├── event_store
│   ├── read_model
│   └── notification
└── interface
    ├── graphql
    └── admin_api

/apps/frontend
├── modules
│   ├── user-self-service
│   └── user-admin-console
├── app
│   ├── (user)
│   └── (admin)
└── tests
    ├── unit
    └── e2e

/tests
├── contract
├── integration
└── acceptance
```

**Structure Decision**: コマンドサービスは既存 `/src` 配下のドメイン駆動構造を拡張し、Next.js アプリは `/apps/frontend` にモジュール分離して同一リポジトリで管理するモノレポ構成とする。

## Complexity Tracking

> **憲章チェックで例外対応が必要な場合のみ記入すること**

現時点で特例は想定していない。
