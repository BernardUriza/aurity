/**
 * Audit Table Component
 * Card: FI-UI-FEAT-206
 */

import type { AuditLogEntry } from "../types/audit";

interface AuditTableProps {
  logs: AuditLogEntry[];
  onSelectLog: (log: AuditLogEntry) => void;
  selectedLog: AuditLogEntry | null;
}

const getOperationBadgeColor = (operation: string): string => {
  const colorMap: Record<string, string> = {
    LOGIN: "bg-green-900/30 text-green-400 border-green-700",
    POLICY_CHANGE: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
    VERIFY: "bg-blue-900/30 text-blue-400 border-blue-700",
    EXPORT: "bg-purple-900/30 text-purple-400 border-purple-700",
    DELETE: "bg-red-900/30 text-red-400 border-red-700",
    INTERACTION_APPENDED: "bg-slate-700/30 text-slate-400 border-slate-600",
    SESSION_CREATED: "bg-slate-700/30 text-slate-400 border-slate-600",
  };

  return colorMap[operation] || "bg-slate-700/30 text-slate-400 border-slate-600";
};

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case "SUCCESS":
      return "bg-green-900/30 text-green-400";
    case "FAILED":
      return "bg-red-900/30 text-red-400";
    case "BLOCKED":
      return "bg-yellow-900/30 text-yellow-400";
    default:
      return "bg-slate-700/30 text-slate-400";
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

const extractSessionId = (metadata: string): string | null => {
  try {
    const parsed = JSON.parse(metadata);
    return parsed.session_id || null;
  } catch {
    return null;
  }
};

export function AuditTable({ logs, onSelectLog, selectedLog }: AuditTableProps) {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Operation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {logs.map((log) => {
              const sessionId = extractSessionId(log.metadata);
              const isSelected = selectedLog?.audit_id === log.audit_id;

              return (
                <tr
                  key={log.audit_id}
                  className={`hover:bg-slate-700/50 cursor-pointer transition-colors ${
                    isSelected ? "bg-slate-700/70" : ""
                  }`}
                  onClick={() => onSelectLog(log)}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatTimestamp(log.timestamp)}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getOperationBadgeColor(
                        log.operation
                      )}`}
                    >
                      {log.operation}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                    {log.user_id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(
                        log.status
                      )}`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-xs truncate max-w-xs">
                        {log.endpoint}
                      </span>
                      {sessionId && (
                        <a
                          href={`/sessions/${sessionId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-400 hover:text-blue-300 text-xs underline"
                        >
                          View Session
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden divide-y divide-slate-700">
        {logs.map((log) => {
          const sessionId = extractSessionId(log.metadata);
          const isSelected = selectedLog?.audit_id === log.audit_id;

          return (
            <div
              key={log.audit_id}
              className={`p-4 hover:bg-slate-700/50 cursor-pointer transition-colors ${
                isSelected ? "bg-slate-700/70" : ""
              }`}
              onClick={() => onSelectLog(log)}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getOperationBadgeColor(
                    log.operation
                  )}`}
                >
                  {log.operation}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(
                    log.status
                  )}`}
                >
                  {log.status}
                </span>
              </div>

              <div className="text-sm text-slate-300 mb-2">{log.user_id}</div>

              <div className="text-xs text-slate-500 mb-2">{formatTimestamp(log.timestamp)}</div>

              <div className="text-xs font-mono text-slate-400 truncate">{log.endpoint}</div>

              {sessionId && (
                <a
                  href={`/sessions/${sessionId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-400 hover:text-blue-300 text-xs underline mt-2 inline-block"
                >
                  View Session →
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Note */}
      {logs.length >= 100 && (
        <div className="bg-slate-700 px-4 py-3 text-center text-sm text-slate-400">
          Showing most recent 100 events. Use filters to narrow results.
        </div>
      )}
    </div>
  );
}
