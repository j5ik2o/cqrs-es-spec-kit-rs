/**
 * UserStatusControl Component
 *
 * ユーザの状態を変更するコントロールコンポーネント。
 * User Story 3 (管理者によるユーザ状況管理) で使用。
 */

'use client';

import { useState } from 'react';

export type UserStatus = 'pending' | 'active' | 'suspended' | 'withdrawn';

export interface UserStatusControlProps {
  currentStatus: UserStatus;
  userId: string;
  onStatusChange: (userId: string, newStatus: UserStatus, reason: string) => Promise<void>;
  isProcessing?: boolean;
}

/**
 * ユーザ状態変更コントロールコンポーネント
 */
export function UserStatusControl({
  currentStatus,
  userId,
  onStatusChange,
  isProcessing = false,
}: UserStatusControlProps) {
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>(currentStatus);
  const [reason, setReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async () => {
    if (selectedStatus === currentStatus) {
      return;
    }

    if (!reason.trim()) {
      alert('変更理由を入力してください');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    await onStatusChange(userId, selectedStatus, reason);
    setShowConfirmation(false);
    setReason('');
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedStatus(currentStatus);
    setReason('');
  };

  return (
    <div className="user-status-control" data-testid="user-status-control">
      <div className="control-header">
        <h3>状態変更</h3>
        <span className="current-status">
          現在の状態: <strong>{getStatusLabel(currentStatus)}</strong>
        </span>
      </div>

      {!showConfirmation ? (
        <div className="control-form">
          <div className="form-field">
            <label htmlFor="status">新しい状態</label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as UserStatus)}
              disabled={isProcessing}
            >
              <option value="pending">仮登録</option>
              <option value="active">有効</option>
              <option value="suspended">一時停止</option>
              <option value="withdrawn">退会済み</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="reason">変更理由 *</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isProcessing}
              placeholder="状態変更の理由を入力してください"
              rows={3}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || selectedStatus === currentStatus || !reason.trim()}
            className="submit-button"
          >
            変更を確認
          </button>
        </div>
      ) : (
        <div className="confirmation-dialog" data-testid="status-change-confirmation">
          <div className="confirmation-message">
            <p>以下の内容で状態を変更します:</p>
            <ul>
              <li>
                変更前: <strong>{getStatusLabel(currentStatus)}</strong>
              </li>
              <li>
                変更後: <strong>{getStatusLabel(selectedStatus)}</strong>
              </li>
              <li>
                理由: <strong>{reason}</strong>
              </li>
            </ul>
            <p className="warning">この操作は監査ログに記録されます。</p>
          </div>
          <div className="confirmation-actions">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing}
              className="cancel-button"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="confirm-button"
              data-testid="confirm-status-change"
            >
              {isProcessing ? '変更中...' : '変更を実行'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusLabel(status: UserStatus): string {
  switch (status) {
    case 'pending':
      return '仮登録';
    case 'active':
      return '有効';
    case 'suspended':
      return '一時停止';
    case 'withdrawn':
      return '退会済み';
    default:
      return '不明';
  }
}
