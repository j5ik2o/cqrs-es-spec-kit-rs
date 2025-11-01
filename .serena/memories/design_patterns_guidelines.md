# 設計パターンとガイドライン

## DDD パターン適用指針

### 集約（Aggregate）
- **定義**: トランザクション境界とライフサイクルを持つエンティティの集合
- **ルート**: 集約ルート（Aggregate Root）のみ外部から参照可能
- **不変条件**: 集約内で完結する不変条件を保証
- **例**: `User` 集約、`Order` 集約
- **実装**: `domain/<aggregate>/` ディレクトリに配置

### エンティティ（Entity）
- **識別子**: 一意な ID を持つ（例: `UserId`, `OrderId`）
- **可変性**: 状態変更可能だが、ID は不変
- **実装**: `domain/<aggregate>/<entity>.rs`

### 値オブジェクト（Value Object）
- **不変性**: 作成後変更不可
- **等価性**: 値の内容で比較（ID ではなく）
- **例**: `Email`, `Money`, `Address`
- **実装**: `domain/<aggregate>/<value_object>.rs`
- **派生トレイト**: `#[derive(Clone, PartialEq, Eq)]`

### ドメインイベント（Domain Event）
- **不変性**: 過去の事実を表現、変更不可
- **命名**: 過去形で命名（例: `UserCreated`, `OrderPlaced`）
- **バージョニング**: スキーマ変更に備えたバージョン番号を含む
- **実装**: `domain/<aggregate>/events.rs`
- **例**:
  ```rust
  #[derive(Debug, Clone, Serialize, Deserialize)]
  pub struct UserCreated {
      pub version: u32,
      pub user_id: UserId,
      pub email: Email,
      pub created_at: DateTime<Utc>,
  }
  ```

### ドメインサービス（Domain Service）
- **責務**: 複数の集約にまたがるビジネスロジック
- **配置**: `domain/services/`
- **例**: ユーザー重複チェック、注文在庫確認

### リポジトリ（Repository）
- **責務**: 集約の永続化と取得を抽象化
- **ポート定義**: ユースケース層でトレイト定義
- **実装**: インフラ層で具体実装
- **例**:
  ```rust
  // usecase/ports/user_repository.rs
  pub trait UserRepository {
      async fn save(&self, user: &User) -> Result<()>;
      async fn find_by_id(&self, id: &UserId) -> Result<Option<User>>;
  }
  
  // infra/dynamodb/user_repository_impl.rs
  pub struct DynamoDbUserRepository { /* ... */ }
  impl UserRepository for DynamoDbUserRepository { /* ... */ }
  ```

## CQRS パターン

### コマンド（Command）
- **定義**: 集約の状態変更を表現
- **命名**: 命令形（例: `CreateUser`, `PlaceOrder`）
- **処理**: ユースケース層のアプリケーションサービスで実行
- **結果**: ドメインイベント発行 → イベントストアへ保存

### クエリ（Query）
- **定義**: リードモデルからのデータ取得
- **処理**: BFF が MySQL リードモデルへ直接クエリ
- **最適化**: GraphQL スキーマに合わせたインデックス設計

## イベントソーシングパターン

### イベントストア
- **実装**: DynamoDB
- **スキーマ**: `references/event-store-adapter-rs` に準拠
  - `aggregate_id` (Partition Key)
  - `sequence_number` (Sort Key)
  - `event_type`, `event_data`, `version`, `timestamp`

### スナップショット
- **目的**: イベント再生の高速化
- **タイミング**: 100 イベントごと、または集約サイズ閾値超過時
- **保存先**: DynamoDB（別テーブルまたは同一テーブルの特殊行）

### イベント再生（Replay）
- **用途**: 集約の状態復元、リードモデル再構築
- **実装**: イベントハンドラで `apply_event()` を順次呼び出し

## ヘキサゴナルアーキテクチャ（Ports & Adapters）

### ポート（Port）
- **入力ポート**: ユースケース層が公開するインターフェース
- **出力ポート**: ユースケースが依存する外部インターフェース（リポジトリ等）
- **配置**: `usecase/ports/`

### アダプタ（Adapter）
- **入力アダプタ**: GraphQL リゾルバ、Lambda ハンドラ
- **出力アダプタ**: DynamoDB リポジトリ、Kinesis パブリッシャー
- **配置**: `adapter/`, `infra/`

## 依存性注入（DI）

### トレイトベース DI
```rust
// ユースケース
pub struct CreateUserService<R: UserRepository> {
    user_repo: R,
}

impl<R: UserRepository> CreateUserService<R> {
    pub fn new(user_repo: R) -> Self {
        Self { user_repo }
    }
    
    pub async fn execute(&self, command: CreateUserCommand) -> Result<UserId> {
        // ...
    }
}
```

### Lambda での DI
- **初期化**: Lambda `init` 時に依存関係を構築
- **再利用**: コールド起動のオーバーヘッド削減

## エラーハンドリング戦略

### ドメインエラー
```rust
#[derive(Debug, thiserror::Error)]
pub enum DomainError {
    #[error("Invalid email format: {0}")]
    InvalidEmail(String),
    
    #[error("User already exists: {0}")]
    UserAlreadyExists(UserId),
}
```

### ユースケースエラー
```rust
#[derive(Debug, thiserror::Error)]
pub enum UseCaseError {
    #[error("Domain error: {0}")]
    Domain(#[from] DomainError),
    
    #[error("Repository error: {0}")]
    Repository(String),
}
```

### インフラエラー
- AWS SDK エラーを `UseCaseError::Repository` へマッピング
- リトライ可能・不可能を明確に分類

## テスト戦略

### ドメイン層テスト
- **Given-When-Then パターン**
- **例**:
  ```rust
  #[test]
  fn test_create_user_with_valid_email_succeeds() {
      // Given
      let email = Email::new("test@example.com").unwrap();
      
      // When
      let user = User::new(UserId::new(), email);
      
      // Then
      assert_eq!(user.email().value(), "test@example.com");
  }
  ```

### ユースケース層テスト
- **モックリポジトリ** (`mockall` クレート等）
- コマンド実行 → イベント発行を検証

### 統合テスト
- LocalStack 環境で E2E テスト
- DynamoDB → Kinesis → MySQL の流れを検証

## 参考パターン
- **Factory パターン**: 複雑なエンティティ生成
- **Strategy パターン**: スナップショット戦略の切り替え
- **Observer パターン**: イベントハンドラの登録
