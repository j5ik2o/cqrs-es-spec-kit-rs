/**
 * WithdrawalConfirmation Component
 *
 * 退会確認ダイアログコンポーネント。
 * User Story 2 (自主退会の完了) で使用。
 */

'use client';

export interface WithdrawalConfirmationProps {
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isProcessing?: boolean;
}

/**
 * 退会確認ダイアログコンポーネント
 */
export function WithdrawalConfirmation({
  onConfirm,
  onCancel,
  isProcessing = false,
}: WithdrawalConfirmationProps) {
  return (
    <div className="withdrawal-confirmation" data-testid="withdrawal-confirmation">
      <div className="confirmation-content">
        <h2>退会の確認</h2>
        <div className="warning-message">
          <p>本当に退会しますか?</p>
          <p>
            退会すると、以下の影響があります:
          </p>
          <ul>
            <li>アカウントが無効化され、ログインできなくなります</li>
            <li>登録情報は法令で許容される範囲で保持されます</li>
            <li>退会完了通知がメールで送信されます</li>
          </ul>
          <p className="notice">
            ※ 30日以内であればアカウント復元の要求が可能です
          </p>
        </div>
        <div className="confirmation-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="cancel-button"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="confirm-button danger"
            data-testid="confirm-withdrawal-button"
          >
            {isProcessing ? '退会処理中...' : '退会する'}
          </button>
        </div>
      </div>
    </div>
  );
}
