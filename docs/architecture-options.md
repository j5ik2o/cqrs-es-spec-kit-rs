# BFF アーキテクチャ比較

本ドキュメントでは、ライブ更新対応を前提とした BFF 構成について、次の 2 案を整理する。

1. Next.js API Routes BFF + Redis Pub/Sub
2. Rust 製 BFF（GraphQL Gateway/Subscription 提供）

## 案 A: Next.js API Routes BFF + Redis Pub/Sub

### 概要
- フロントエンドと同一デプロイ単位に BFF を配置し、API Routes でコマンド・クエリ双方を仲介する。
- 読み取り系は API Routes → MySQL（リードモデル）、コマンド系は API Routes → GraphQL Mutation（Rust リソースサーバ）。
- リアルタイム通知はリードモデル更新サービスが Redis Pub/Sub に通知し、API Routes が SSE/WebSocket でクライアントへブロードキャストする。

### メリット
- デプロイ／リリース単位が Next.js に集約され、フロントと BFF の認証・設定を同一リポジトリで管理できる。
- API Routes のみで RSC/CSR からのアクセスパターンを統一でき、MySQL や Redis への接続維持も Node.js ランタイム側で完結する。
- GraphQL は Mutation 専用に限定されるため、リソースサーバの責務がシンプルでユースケース境界を保ちやすい。
- Redis Pub/Sub を活用することで、Kinesis→MySQL 反映後のイベント通知を低レイテンシで配信できる。

### デメリット / 留意点
- Node.js ランタイムに Redis サブスクライブラや SSE/WebSocket を常駐させるため、スケール戦略（コネクション数、状態共有）を検討する必要がある。
- API Routes が BFF の全責務（認証、権限制御、監査、リードモデル参照、リアルタイム通知）を担うため、ロジックが肥大化しがち。レイヤリング設計が必須。
- GraphQL を Query/Subscription に拡張する場合、API Routes 側で新たなプロトコル対応が必要になる。

### 運用面の前提
- Redis は Pub/Sub もしくは Streams を採用。Kinesis からの遅延を吸収しつつ再送や耐障害性を確保する場合は Streams + 消費位置トラッキングを検討。
- Next.js デプロイ構成（Serverless/Edge/Node.js 常駐）によっては 長時間接続を保証できないため、SSE/WebSocket の対応可否を事前確認。
- RSC は API Routes をフェッチして静的データ化し、クライアント側でリアルタイム反映を行う（ハイブリッド構成）。

## 案 B: Rust 製 BFF（GraphQL Gateway/Subscription 提供）

### 概要
- Next.js とは別に Rust で専用 BFF サーバを構築し、GraphQL Query/Mutation/Subscription を提供する。
- BFF がクエリを MySQL へ接続して処理し、Mutation は内部でユースケース層（もしくはリソースサーバ）を呼び出す。
- ライブ更新は GraphQL Subscription または WebSocket/SSE を用いて実装し、Redis/Kinesis からのイベントを Rust BFF が仲介する。

### メリット
- GraphQL で Query/Mutation/Subscription を統一でき、スキーマ駆動でクライアントと契約管理が可能。
- Rust によって高性能・低レイテンシの BFF を構築でき、長時間接続（WebSocket 等）も同一言語で扱える。
- Next.js からは GraphQL クライアント 1 つで全機能を利用でき、RSC でも GraphQL Fetcher を組み込めば同一プロトコルを利用可能。

### デメリット / 留意点
- Next.js とは別のサービスとして運用するため、デプロイ・監視・スケール戦略が増える。CI/CD や IaC を追加整備する必要がある。
- Next.js 側は GraphQL クライアント設定（認証ヘッダ付与、キャッシュ戦略、エラーハンドリング）を全経路で実装する必要があり、RSC での利用には追加のラッパや Fetcher 設計が必要。
- GraphQL リソースサーバ（コマンド処理）が既に存在する場合、BFF との責務境界を再定義し、重複実装や二重管理を避ける調整が必要。
- 憲章に基づき大幅なアーキテクチャ変更となるため、OpenSpec の提案や設計書更新（proposal/design/tasks）を経て合意を取る必要がある。

### 運用面の前提
- GraphQL Gateway として API スキーマ管理を強化し、バージョンや deprecation ポリシーを整備する。
- Subscription の実装は Redis/Kinesis からのイベントを受け取り、クライアントへ push するストリーム処理を Rust 側で完結させる。
- Next.js からは HTTP over GraphQL（Query/Mutation）および WebSocket（Subscription）を利用するため、クライアント SDK（例: Apollo, urql, graphql-request）を RSC/CSR 両方に対応させる設計が必要。

## 推奨判断指針
- **デプロイ簡素化・Next.js と一体運用を優先する場合**: 案 A を採用し、Redis Pub/Sub を組み合わせてリアルタイム性を補う。
- **GraphQL をフルスタックで活用したい、もしくは大規模なユースケース統合を狙う場合**: 案 B を検討。ただし BFF サービスの追加運用コストとアーキテクチャ再設計を前提とし、OpenSpec での合意形成が必須。
- どちらの案でも、ライブ更新要件に応じた通知粒度・再同期戦略・監視指標を仕様として整理し、クライアントの状態管理方針（ローカルキャッシュ／再フェッチ／差分適用）を明確にすること。
