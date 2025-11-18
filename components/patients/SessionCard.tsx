/**
 * SessionCard Component
 *
 * SOLID Principle: Single Responsibility
 * - Only renders a SINGLE session card
 * - Receives session data and callbacks (Dependency Inversion)
 *
 * @example
 * <SessionCard
 *   session={sessionData}
 *   status={sessionStatus}
 *   onSelect={(id) => loadSession(id)}
 *   onDelete={(id) => deleteSession(id)}
 * />
 */

import React from 'react';
import {
  Clock, User, Activity, Stethoscope, Copy, Check, Trash2,
  CheckCircle2, Loader2, X
} from 'lucide-react';
import { SessionSummary, SessionTaskStatus, TaskStatus } from '@/types/patient';

export interface SessionCardProps {
  session: SessionSummary;
  status: SessionTaskStatus;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onCopyId: (sessionId: string, e: React.MouseEvent) => void;
  copiedSessionId: string | null;
  extractMedicalInfo: (preview: string) => string[];
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  status,
  onSelect,
  onDelete,
  onCopyId,
  copiedSessionId,
  extractMedicalInfo
}) => {
  const date = new Date(session.metadata.created_at);
  const isToday = date.toDateString() === new Date().toDateString();
  const duration = session.timespan?.duration_human || 'N/A';
  const chunkCount = session.size?.interaction_count || 0;
  const preview = session.preview || 'Sin transcripción';
  const sessionId = session.metadata.session_id;
  const patientName = session.patient_name || 'Paciente';
  const doctorName = session.doctor_name || '';
  const keywords = extractMedicalInfo(preview);

  const getStatusBadge = (statusType: TaskStatus, label: string) => {
    const statusIcons: Record<TaskStatus, React.ReactNode> = {
      completed: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
      in_progress: <Loader2 className="h-3 w-3 text-yellow-400 animate-spin" />,
      pending: <Clock className="h-3 w-3 text-slate-400" />,
      failed: <X className="h-3 w-3 text-red-400" />,
      not_started: null
    };

    const statusColors: Record<TaskStatus, string> = {
      completed: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      in_progress: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
      pending: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
      failed: 'bg-red-500/10 border-red-500/30 text-red-300',
      not_started: 'bg-slate-700/20 border-slate-600/20 text-slate-500'
    };

    if (statusType === 'not_started') return null;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded text-xs font-medium ${statusColors[statusType]}`}>
        {statusIcons[statusType]}
        {label}
      </span>
    );
  };

  return (
    <div className="relative group/session">
      <div
        onClick={() => onSelect(sessionId)}
        className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all cursor-pointer"
      >
        {/* Header: Date + Time + Delete */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-white">
              {date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
            </span>
            {isToday && (
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300">
                Hoy
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {date.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Mexico_City',
                hour12: true
              })}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(sessionId);
              }}
              className="opacity-0 group-hover/session:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all"
              title="Eliminar sesión"
            >
              <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
            </button>
          </div>
        </div>

        {/* Patient Name */}
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-cyan-300">
            {patientName}
            {doctorName && (
              <span className="text-slate-400 font-normal text-xs ml-2">
                · Dr. {doctorName}
              </span>
            )}
          </h3>
        </div>

        {/* Session ID + Copy + Duration */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">{sessionId.slice(0, 12)}...</span>
            <div
              onClick={(e) => onCopyId(sessionId, e)}
              className="p-1 hover:bg-slate-700/50 rounded transition-colors group/copy cursor-pointer"
              title="Copiar session ID"
              role="button"
              tabIndex={0}
            >
              {copiedSessionId === sessionId ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3 text-slate-500 group-hover/copy:text-cyan-400" />
              )}
            </div>
          </div>
          <span className="text-xs text-cyan-400 font-semibold">{duration}</span>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {getStatusBadge(status.soapStatus, 'SOAP')}
          {getStatusBadge(status.diarizationStatus, 'Diarización')}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-xs text-cyan-300">
            <Activity className="h-3 w-3" />
            {chunkCount} chunks
          </span>
        </div>

        {/* Medical Keywords */}
        {keywords.length > 0 && (
          <div className="flex items-start gap-2 mb-3">
            <Stethoscope className="h-3.5 w-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-300"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        <p className="text-xs text-slate-400 line-clamp-2 italic">
          "{preview.slice(0, 100)}{preview.length > 100 ? '...' : ''}"
        </p>
      </div>
    </div>
  );
};
