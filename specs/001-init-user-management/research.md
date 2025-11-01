# Research Notes: ユーザ管理基盤初期構築

## Decision 1: Next.js のターゲットバージョン
- Decision: Next.js 15 (App Router 安定版) を採用する。
- Rationale: 2025 年現在の LTS 対応版であり App Router と Server Actions が安定化しているため、モジュール分離と BFF 連携の実装がシンプルになる。Vercel サポートも長期提供され GraphQL クライアント統合の知見が豊富。
- Alternatives considered: Next.js 14 (既存安定版だが 15 の改善を享受できない)、Remix (GraphQL 連携時の標準パターンが少なくモジュール分割要件と乖離)、専用管理画面を別フレームワークで構築 (モノレポ要件と衝突)。

## Decision 2: 通知チャネルの選定
- Decision: AWS SES をメール通知チャネルとして採用し、既存 AWS インフラに統合する。
- Rationale: DynamoDB・Lambda・Kinesis を中心とした既存インフラに自然に組み込める。SES は退会完了やサインアップ確認といったトランザクションメールに特化しており、IAM ベースのアクセス制御と監査ログが整備されている。
- Alternatives considered: SendGrid (迅速に導入できるが外部 SaaS 依存が増えガバナンスの負担が拡大)、Postmark (高信頼だが AWS 環境との統合ポイントが少ない)、SMS 通知 (本人確認が目的のため必須ではなくコストが上がる)。

## Decision 3: 認証管理ライブラリ
- Decision: NextAuth.js で BFF と連携したセッション管理を採用する。
- Rationale: GraphQL BFF と Next.js の組み合わせで実績が多く、メールリンク認証とパスワードベース認証を同一フローに統合しやすい。管理者モジュールとのロールベース認可もプラグインで拡張可能。
- Alternatives considered: Auth0 等の IDaaS (運用負担は減るがイベントソーシングとの統合が複雑)、独自実装 (初期コストとセキュリティリスクが増大)、Supabase Auth (Postgres 前提で DynamoDB ベースの現在構成と不整合)。

## Decision 4: イベントストア運用ベストプラクティス確認
- Decision: event-store-adapter-rs におけるユーザ集約ストリームは `user-{uuid}` 形式とし、メール認証や退会のステータス遷移は単一集約に閉じる。
- Rationale: 憲章の DDD 集約境界遵守とイベント再生性能を両立し、読みモデル更新 Lambda における冪等性の確保が容易。
- Alternatives considered: 状態別にストリーム分割 (再生コストが増大)、複数集約連携 (境界が曖昧になり不変条件が崩れる)。

## Decision 5: GraphQL/BFF との連携パターン
- Decision: GraphQL Mutation を通じてコマンド送出し、Subscription で状態更新を購読する二層構成を維持する。
- Rationale: 憲章「CQRSとGraphQL契約の一貫性」に則り、Next.js からは BFF 経由のみでイベントに追従できる。管理者コンソールも共通の契約を利用できる。
- Alternatives considered: REST エンドポイント追加 (契約が分散しガバナンス低下)、直接 DynamoDB 読み取り (CQRS 分離が崩れる)。

## Decision 6: テスト戦略ベストプラクティス
- Decision: cargo test (ドメイン/アプリケーション層)、cargo lambda build + LocalStack による統合テスト、Next.js 側は Playwright による E2E と Vitest によるモジュールテストを標準とする。
- Rationale: 既存リポジトリの標準に沿いつつ、利用者向け/管理者向けフローをエンドツーエンドで担保できる。
- Alternatives considered: Cypress (Playwright と比較しモジュール分割テストが複雑)、Jest のみ (ブラウザ操作テストが不足)、ローカルモックのみ (インフラ整合が検証できない)。
