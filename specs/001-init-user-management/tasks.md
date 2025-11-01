# Tasks: ユーザ管理基盤初期構築

**Input**: `/specs/001-init-user-management/` 以下の design ドキュメント  
**Prerequisites**: plan.md（必須）、spec.md（ユーザーストーリー必須）、research.md、data-model.md、contracts/

**Tests**: 仕様で明示的に要求されたユーザーフロー検証のため、各ユーザーストーリーで Playwright ベースの E2E テストを追加する。

**構成**: タスクはユーザーストーリー単位でグルーピングし、各ストーリーが独立して実装・テストできるようにする。

## Phase 1: Setup (共有基盤)

**目的**: モノレポ構成とツールチェーンを整備し、以降の実装基盤を構築する。

- [ ] T001 apps/frontend/ と tests/ ディレクトリを作成し plan.md 通りのモノレポ構成に整える (apps/frontend/, tests/)
- [ ] T002 pnpm-workspace.yaml を追加し apps/frontend/ を含むワークスペース設定を定義する (pnpm-workspace.yaml)
- [ ] T003 Next.js 15 プロジェクトを apps/frontend/ に初期化し基本ページと設定を用意する (apps/frontend/package.json, apps/frontend/app/layout.tsx)
- [ ] T004 フロントエンドのモジュール分離用ディレクトリを作成しベースコンポーネントを配置する (apps/frontend/modules/user-self-service/, apps/frontend/modules/user-admin-console/)
- [ ] T005 Rust 側でユーザ管理機能に必要なクレート依存を Cargo.toml に追加しビルドが通ることを確認する (Cargo.toml)

---

## Phase 2: Foundational (全ストーリーの前提)

**目的**: すべてのユーザーストーリーで共通利用するドメイン基盤・インフラ構成を準備する。

- [ ] T006 ユーザ集約モジュールのスケルトンを作成し公開モジュールを定義する (src/domain/user/mod.rs)
- [ ] T007 イベントソーシング設定と `event-store-adapter-rs` のバインディングを追加する (src/infrastructure/event_store/user_event_store.rs)
- [ ] T008 読みモデル基盤とプロジェクタ用の抽象クラスを定義する (src/infrastructure/read_model/mod.rs)
- [ ] T009 AWS SES を利用するメール送信アダプタの共通実装を追加する (src/infrastructure/notification/ses_mailer.rs)
- [ ] T010 GraphQL スキーマ初期化処理と共通ミドルウェアを準備する (src/interface/graphql/schema.rs)
- [ ] T011 NextAuth.js のベース設定とロール管理を実装する (apps/frontend/lib/auth/nextauth.ts)
- [ ] T012 [P] Playwright 設定と共通 E2E ヘルパーを整備する (apps/frontend/tests/e2e/playwright.config.ts)

**チェックポイント**: 基盤準備完了。以降のストーリーを並列で進められる。

---

## Phase 3: User Story 1 - セルフサインアップとプロフィール確認 (Priority: P1) 🎯 MVP

**ゴール**: 訪問者がサインアップし、メール認証後に自分のプロフィールを確認できる。 
**独立テスト**: SignUp→メール認証→プロフィール閲覧のエンドツーエンドシナリオを Playwright で実行する。

### User Story 1 実装

- [ ] T013 [US1] サインアップ用のコマンド DTO と検証ロジックを追加する (src/application/commands/user/register_end_user.rs)
- [ ] T014 [US1] EndUserAccount 集約に登録・メール認証メソッドと発火イベントを実装する (src/domain/user/end_user_account.rs)
- [ ] T015 [P] [US1] 登録コマンドハンドラとイベント保存処理を実装する (src/application/handlers/user/register_end_user_handler.rs)
- [ ] T016 [P] [US1] メール認証リクエストと確認コマンドを実装する (src/application/commands/user/confirm_email.rs)
- [ ] T017 [P] [US1] 読みモデルプロジェクタでプロフィールビューを構築する (src/infrastructure/read_model/end_user_profile_projector.rs)
- [ ] T018 [P] [US1] GraphQL Mutation signUpUser / confirmUserEmail を追加しスキーマに結線する (src/interface/graphql/mutation/sign_up_user.rs)
- [ ] T019 [P] [US1] GraphQL Query viewer を実装し認証済み利用者情報を返却する (src/interface/graphql/query/viewer.rs)
- [ ] T020 [US1] SES 向けサインアップ確認メールテンプレートを追加する (src/infrastructure/notification/templates/signup_confirmation.html)
- [ ] T021 [P] [US1] Next.js のサインアップページを作成し BFF Mutation を呼び出す (apps/frontend/app/(user)/signup/page.tsx)
- [ ] T022 [US1] プロフィール確認ページを実装し viewer Query を表示する (apps/frontend/app/(user)/account/page.tsx)
- [ ] T023 [US1] サインアップからプロフィール確認までの E2E テストを追加する (apps/frontend/tests/e2e/user-signup.spec.ts)

**チェックポイント**: User Story 1 が単独でテスト・デモ可能。

---

## Phase 4: User Story 2 - 自主退会の完了 (Priority: P2)

**ゴール**: 利用者が自分の意志で退会し、通知とアカウント無効化が反映される。 
**独立テスト**: 既存ユーザが退会操作を完了し、以降ログイン不可となるシナリオを Playwright で検証する。

### User Story 2 実装

- [ ] T024 [US2] 退会用コマンドとバリデーションを実装する (src/application/commands/user/withdraw_end_user.rs)
- [ ] T025 [US2] EndUserAccount 集約に退会メソッドと対応イベントを追加する (src/domain/user/end_user_account.rs)
- [ ] T026 [P] [US2] プロジェクタで退会状態と履歴を読みモデルに反映する (src/infrastructure/read_model/end_user_profile_projector.rs)
- [ ] T027 [P] [US2] GraphQL Mutation withdrawSelf を追加し認証済み利用者の退会を処理する (src/interface/graphql/mutation/withdraw_self.rs)
- [ ] T028 [P] [US2] 退会完了メールテンプレートを作成し通知を送信する (src/infrastructure/notification/templates/withdrawal_completed.html)
- [ ] T029 [US2] Next.js の退会確認フロー UI を実装する (apps/frontend/app/(user)/account/withdraw/page.tsx)
- [ ] T030 [US2] 退会フローの E2E テストを追加する (apps/frontend/tests/e2e/user-withdrawal.spec.ts)

**チェックポイント**: User Story 1 と 2 が互いに独立して成立。

---

## Phase 5: User Story 3 - 管理者によるユーザ状況管理 (Priority: P3)

**ゴール**: 管理者がユーザ一覧と詳細を把握し、状態を変更して監査ログを確認できる。 
**独立テスト**: 管理者が一覧→詳細→状態変更→監査ログ確認を行うシナリオを Playwright で検証する。

### User Story 3 実装

- [ ] T031 [US3] 管理者向けユーザ一覧読みモデルと集約クエリを実装する (src/infrastructure/read_model/admin_user_list_projector.rs)
- [ ] T032 [US3] 監査ログ読みモデルを追加しフィルタリングを実現する (src/infrastructure/read_model/account_status_audit_projector.rs)
- [ ] T033 [P] [US3] GraphQL Query adminUsers / adminUserAuditTrail を実装する (src/interface/graphql/query/admin_users.rs)
- [ ] T034 [P] [US3] GraphQL Mutation updateUserStatus を追加し管理者操作を処理する (src/interface/graphql/mutation/update_user_status.rs)
- [ ] T035 [US3] 管理者権限チェックと監査ログ記録をアプリケーションサービスに実装する (src/application/handlers/user/update_user_status_handler.rs)
- [ ] T036 [P] [US3] Next.js 管理者一覧ページを作成しフィルタ・ソートを実装する (apps/frontend/app/(admin)/users/page.tsx)
- [ ] T037 [P] [US3] Next.js 管理者詳細・状態変更ページを実装する (apps/frontend/app/(admin)/users/[id]/page.tsx)
- [ ] T038 [US3] 管理者操作の E2E テストを追加する (apps/frontend/tests/e2e/admin-user-management.spec.ts)

**チェックポイント**: すべてのユーザーストーリーが独立して機能。

---

## Phase 6: Polish & Cross-Cutting Concerns

**目的**: 横断的な品質向上とドキュメント整備を行う。

- [ ] T039 [P] 成功基準計測用の監視メトリクスとダッシュボードを docs/monitoring.md に追記する (docs/monitoring.md)
- [ ] T040 quickstart.md を最新手順に更新し検証結果を反映する (specs/001-init-user-management/quickstart.md)
- [ ] T041 README とリリースノートを更新し新機能と実行手順を共有する (README.md)

---

## 依存関係と実行順序

### フェーズ間依存
- Setup (Phase 1) → Foundational (Phase 2) → User Stories (Phase 3〜5) → Polish (Phase 6) の順に実施する。
- 並列タスクは [P] マークを参照し、前提フェーズ完了後に着手する。

### ユーザーストーリー依存
- US1 (P1) は MVP として最優先で実装する。
- US2 (P2) は US1 の通知・認証基盤を再利用するが、読みモデル拡張後は独立検証が可能。
- US3 (P3) は管理者向け読みモデルと権限チェックの実装に依存するため、US1/US2 完了後に着手することを推奨する。

### ストーリー内の順序
- コマンド/ドメイン → ハンドラ/プロジェクタ → GraphQL 層 → フロントエンド → E2E テストの順で進める。
- SES テンプレートなどの通知は該当 Mutation 完成前に準備しておくと検証が容易。

### 並列実行の例
- US1: T015・T016・T017 はドメイン層と読みモデルを並列実装できる。
- US2: T026・T027 は BFF と通知を並列に進められる。
- US3: T033・T034・T036・T037 は GraphQL とフロントエンドを分担可能。
- Foundational: T012 は他タスクと並列で進められる。

---

## 実装戦略

### MVP 優先
1. Phase 1〜2 を完了し基盤を固める。  
2. User Story 1 (P1) を実装してサインアップ〜プロフィール確認をデモできる状態にする。  
3. 成果をステークホルダーにレビューし、成功基準 SC-001/002 の暫定計測を開始する。

### 段階的デリバリー
1. US1 リリース後に US2 を追加し退会と通知を提供する。  
2. US2 完了後、US3 を実装して管理者機能を展開する。  
3. 各段階で quickstart.md を更新し、CI の E2E を順次追加する。

### 複数人での並列開発
1. 基盤構築後、US1→US2→US3 をそれぞれ担当者に割り当てる。  
2. [P] タスクを参考にフロントエンド・バックエンド・インフラを役割分担する。  
3. Playwright の共通ヘルパーを共有し、ストーリーごとのシナリオを迅速に追加する。
