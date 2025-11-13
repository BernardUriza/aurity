/**
 * SessionBadges Component
 *
 * Displays Session ID and Job ID badges with copy-to-clipboard functionality.
 *
 * Features:
 * - Session ID badge (UUID format)
 * - Job ID badge (when available)
 * - Copy to clipboard on hover
 * - Truncated display with full copy
 *
 * Extracted from ConversationCapture (Phase 7)
 */

import { Copy, Check } from 'lucide-react';

interface SessionBadgesProps {
  sessionId: string | null;
  jobId: string | null;
  copiedId: string | null;
  onCopy: (id: string, type: string) => void;
}

export function SessionBadges({
  sessionId,
  jobId,
  copiedId,
  onCopy,
}: SessionBadgesProps) {
  if (!sessionId && !jobId) return null;

  return (
    <div className="absolute top-0 right-0 z-10">
      <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1.5 shadow-lg">
        <div className="flex flex-col gap-1">
          {sessionId && (
            <div className="flex items-center gap-2 group">
              <span className="text-xs text-slate-400 font-medium">Session:</span>
              <code className="text-xs font-mono text-emerald-400 tracking-tight">
                {sessionId.slice(0, 8)}...
              </code>
              <button
                onClick={() => onCopy(sessionId, 'session')}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-700 rounded"
                title="Copy full Session ID"
              >
                {copiedId === 'session' ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-slate-400" />
                )}
              </button>
            </div>
          )}
          {jobId && (
            <div className="flex items-center gap-2 group">
              <span className="text-xs text-slate-400 font-medium">Job:</span>
              <code className="text-xs font-mono text-cyan-400 tracking-tight">
                {jobId.slice(0, 8)}...
              </code>
              <button
                onClick={() => onCopy(jobId, 'job')}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-700 rounded"
                title="Copy full Job ID"
              >
                {copiedId === 'job' ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-slate-400" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
