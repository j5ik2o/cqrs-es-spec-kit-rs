# コードベース構造

## ディレクトリ構成概要
```
cqrs-es-spec-kit-rs/
├── src/                    # Rust ソースコード
│   └── main.rs             # エントリーポイント（現在は最小構成）
├── specs/                  # 仕様書（ユースケース・受入条件）
├── docs/                   # 技術ドキュメント
│   ├── local-sandbox.md    # ローカル環境セットアップ
│   ├── application-constraints.md  # 共通技術制約
│   └── architecture-options.md     # アーキテクチャ選択肢
├── scripts/                # 開発補助スクリプト
│   ├── localstack/         # LocalStack 操作スクリプト
│   │   ├── bootstrap.sh    # DynamoDB・Kinesis 初期化
│   │   └── deploy-lambdas.sh  # Lambda デプロイ
│   ├── run-claude.sh       # Claude Code 起動
│   ├── run-gemini.sh       # Gemini Code Assist 起動
│   └── run-codex.sh        # Codex 起動
├── .specify/               # Speckit 管理ディレクトリ
│   ├── memory/             # プロジェクトメモリ
│   │   └── constitution.md # DDD 憲章（最優先ガイドライン）
│   ├── templates/          # 仕様・計画・タスクテンプレート
│   │   ├── spec-template.md
│   │   ├── plan-template.md
│   │   └── tasks-template.md
│   └── scripts/            # Speckit スクリプト
├── openspec/               # OpenSpec 仕様管理
│   ├── AGENTS.md           # AI エージェント向けガイド
│   ├── project.md          # プロジェクトメタデータ
│   ├── specs/              # 機能仕様
│   └── changes/            # 変更提案
├── references/             # リファレンス実装
│   └── event-store-adapter-rs/  # イベントストア設計参照
├── target/                 # Cargo ビルド成果物
├── docker-compose.yml      # LocalStack・MySQL・Redis 定義
├── Cargo.toml              # Rust プロジェクト定義
├── Cargo.lock              # 依存関係ロック
├── .gitmodules             # Git サブモジュール
├── CLAUDE.md               # Claude Code 向け指示
├── GEMINI.md               # Gemini 向け指示
└── AGENTS.md               # 全エージェント共通指示
```

## src/ 予定構造（未実装、DDD レイヤー）
```
src/
├── domain/                 # ドメイン層（ビジネスロジック）
│   ├── user/               # ユーザー集約
│   │   ├── mod.rs
│   │   ├── user.rs         # User エンティティ
│   │   ├── user_id.rs      # UserID 値オブジェクト
│   │   └── events.rs       # UserCreated 等イベント
│   └── shared/             # 共通ドメインロジック
├── usecase/                # ユースケース層
│   ├── create_user/        # ユーザー登録ユースケース
│   │   ├── mod.rs
│   │   ├── service.rs      # アプリケーションサービス
│   │   └── port.rs         # 入出力ポート定義
│   └── ports/              # ユースケース共通ポート
├── adapter/                # インターフェースアダプタ層
│   ├── graphql/            # GraphQL BFF アダプタ
│   └── event_handler/      # イベントハンドラアダプタ
├── infra/                  # インフラストラクチャ層
│   ├── dynamodb/           # DynamoDB イベントストア実装
│   ├── kinesis/            # Kinesis 実装
│   ├── mysql/              # MySQL リードモデル実装
│   └── redis/              # Redis 通知実装
└── lambda/                 # Lambda 関数エントリーポイント
    ├── event_forwarder/    # イベントフォワーダー
    └── read_model_updater/ # リードモデル更新サービス
```

## specs/ 構造（仕様書管理）
```
specs/
├── US-001-user-registration.md  # ユーザー登録仕様
├── US-002-order-creation.md     # 注文作成仕様
└── ...
```

## .specify/templates/ の役割
- **spec-template.md**: 機能仕様書のひな型（ユースケース・受入条件・制約）
- **plan-template.md**: 実装計画書のひな型（技術調査・リスク評価）
- **tasks-template.md**: タスク分解のひな型（実装・テストタスク）

## openspec/ の役割
- **AGENTS.md**: AI エージェント向けの OpenSpec 操作ガイド
- **project.md**: プロジェクトメタデータ（名前・憲章参照）
- **specs/**: 機能仕様の永続化
- **changes/**: 変更提案（proposal.md, tasks.md, design.md）

## references/ の役割
- **event-store-adapter-rs**: DynamoDB イベントストア設計のリファレンス実装
  - スキーマ設計
  - スナップショット戦略
  - バージョニング

## 現在の実装状況
- ✅ プロジェクト骨格
- ✅ docker-compose.yml（LocalStack・MySQL・Redis）
- ✅ 憲章（`.specify/memory/constitution.md`）
- ✅ テンプレート（spec, plan, tasks）
- ✅ LocalStack スクリプト（bootstrap, deploy）
- ⏳ ドメイン層実装（未着手）
- ⏳ Lambda 実装（未着手）
- ⏳ GraphQL BFF（未着手）
- ⏳ Next.js フロントエンド（未着手）
