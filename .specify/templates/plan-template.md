# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: `/specs/[###-feature-name]/spec.md` の機能仕様

**メモ**: このテンプレートは `/speckit.plan` コマンドによって自動生成・更新される。運用手順は `.specify/templates/commands/plan.md` またはプロジェクトドキュメントを参照すること。

## Summary

[機能仕様から主要要件と技術アプローチを引用して簡潔に記述する]

## Technical Context

**Language/Version**: [例: Rust 1.80 など。不明な場合は NEEDS CLARIFICATION]  
**Primary Dependencies**: [例: axum, async-graphql, sqlx など]  
**Storage**: [例: DynamoDB, MySQL, Redis など]  
**Testing**: [例: cargo test, cargo lambda build, LocalStack E2E など]  
**Target Platform**: [例: AWS Lambda, Next.js BFF, CLI など]  
**Project Type**: [single/web/mobile など。憲章の構成に合わせて記述]  
**Performance Goals**: [例: p95 < 200ms, Kinesis レイテンシ < 2s など]  
**Constraints**: [例: DynamoDB ハッシュキー設計、Kinesis パーティション数 など]  
**Scale/Scope**: [例: 同時接続数, 集約件数 など]

## Constitution Check

*ゲート: フェーズ0（リサーチ）開始前に必ず全項目を確認し、フェーズ1（設計）終了時に再確認する。未チェック項目がある場合、実装に進んではならない。*

- [ ] DDD境界: 集約ルート・不変条件・サービス分離・依存方向が「DDD集約境界の厳守」に合致しているか。
- [ ] イベントストア: DynamoDB + `event-store-adapter-rs`、DynamoDB Streams→Lambda（イベントフォワーダー）→Kinesis→Lambda（リードモデル更新）→MySQL の構成と通知基盤（Redis Pub/Sub/Streams）が「イベントストア標準化とDynamoDB運用」に沿っているか。
- [ ] CQRS/GraphQL契約: コマンドサービス・BFF・Next.js の責務分離、GraphQL Query/Mutation/Subscription 契約、BFF の役割が「CQRSとGraphQL契約の一貫性」に従っているか。
- [ ] サンドボックス: LocalStack / MySQL / Redis 手順、`docker-reuse` 設定、`scripts/localstack/*` の運用が「ローカルサンドボックス整合性」の要求を満たすか。
- [ ] ドキュメント同期: proposal/plan/spec/tasks の整合性、テスト戦略、CI ゲートが「OpenSpecドキュメント同期と品質ゲート」に従っているか。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # このファイル (/speckit.plan 出力)
├── research.md          # フェーズ0 (/speckit.plan 出力)
├── data-model.md        # フェーズ1 (/speckit.plan 出力)
├── quickstart.md        # フェーズ1 (/speckit.plan 出力)
├── contracts/           # フェーズ1 (/speckit.plan 出力)
└── tasks.md             # フェーズ2 (/speckit.tasks 出力)
```

### Source Code (repository root)

<!--
  行頭のコメントは案内用。実際の計画では不要な構成を削除し、実在のディレクトリ構造に差し替えること。
-->

```text
# [不要なら削除] Option 1: シングルプロジェクト構成 (デフォルト)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [不要なら削除] Option 2: Web アプリ構成 (frontend + backend)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [不要なら削除] Option 3: Mobile + API
api/
└── [backend と同じ構成]

ios/ or android/
└── [プラットフォーム別のモジュール構成]
```

**Structure Decision**: [採用する構成を明記し、上記のツリーを実際のパスに置き換える]

## Complexity Tracking

> **憲章チェックで例外対応が必要な場合のみ記入すること**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [例: 追加のサービス層] | [必要な理由] | [より単純な方法を却下した理由] |
| [例: イベント整列用の新コンポーネント] | [必要な理由] | [簡易案を採用しない理由] |
