/**
 * AuditLogViewer Component
 *
 * 監査ログを表示するコンポーネント。
 * User Story 3 (管理者によるユーザ状況管理) で使用。
 */

'use client';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  targetUserId: string;
  targetUserName: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  reason: string;
  result: 'success' | 'failure';
}

export interface AuditLogViewerProps {
  logs: AuditLogEntry[];
  isLoading?: boolean;
}

/**
 * 監査ログビューアコンポーネント
 */
export function AuditLogViewer({ logs, isLoading = false }: AuditLogViewerProps) {
  if (isLoading) {
    return (
      <div className="audit-log-loading" data-testid="audit-log-loading">
        読み込み中...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="audit-log-empty" data-testid="audit-log-empty">
        監査ログがありません
      </div>
    );
  }

  return (
    <div className="audit-log-viewer" data-testid="audit-log-viewer">
      <h3>監査ログ</h3>
      <div className="audit-log-list">
        {logs.map((log) => (
          <div
            key={log.id}
            className="audit-log-entry"
            data-result={log.result}
            data-testid="audit-log-entry"
          >
            <div className="log-header">
              <span className="log-timestamp">{formatDateTime(log.timestamp)}</span>
              <span className="log-result" data-result={log.result}>
                {log.result === 'success' ? '成功' : '失敗'}
              </span>
            </div>
            <div className="log-body">
              <div className="log-field">
                <span className="field-label">管理者:</span>
                <span className="field-value">
                  {log.adminName} (ID: {log.adminId})
                </span>
              </div>
              <div className="log-field">
                <span className="field-label">対象ユーザ:</span>
                <span className="field-value">
                  {log.targetUserName} (ID: {log.targetUserId})
                </span>
              </div>
              <div className="log-field">
                <span className="field-label">操作:</span>
                <span className="field-value">{log.action}</span>
              </div>
              {log.previousStatus && log.newStatus && (
                <div className="log-field">
                  <span className="field-label">状態変更:</span>
                  <span className="field-value">
                    {log.previousStatus} → {log.newStatus}
                  </span>
                </div>
              )}
              <div className="log-field">
                <span className="field-label">理由:</span>
                <span className="field-value">{log.reason}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
}
