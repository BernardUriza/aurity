/**
 * WorkflowProgress Component
 *
 * Backend processing workflow progress indicator.
 *
 * Features:
 * - Progress bar with percentage
 * - Stage status grid (upload, transcribe, diarize, soap)
 * - Icons and animations
 * - Status indicators (pending, in_progress, completed, failed)
 *
 * Extracted from ConversationCapture (Phase 7)
 */

import { Loader2 } from 'lucide-react';

interface WorkflowStatus {
  job_id: string;
  session_id: string;
  status: string;
  progress_pct: number;
  stages: {
    upload: string;
    transcribe: string;
    diarize: string;
    soap: string;
  };
  soap_note?: any;
  result_data?: any;
  error?: string;
}

interface WorkflowProgressProps {
  workflowStatus: WorkflowStatus;
}

export function WorkflowProgress({ workflowStatus }: WorkflowProgressProps) {
  const stageLabels: Record<string, string> = {
    upload: '📤 Upload',
    transcribe: '🎤 Whisper',
    diarize: '👥 Speakers',
    soap: '📋 SOAP'
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-in fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
        <h3 className="text-lg font-semibold text-white">Procesamiento Backend FI</h3>
      </div>

      {/* Progress Bar with gradient */}
      <div className="mb-6">
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-emerald-500 to-cyan-500"
            style={{ width: `${workflowStatus.progress_pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-slate-400">{workflowStatus.progress_pct}% completado</p>
          <p className="text-xs text-slate-500">Backend con VAD automático</p>
        </div>
      </div>

      {/* Stage Status Grid with Icons */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(workflowStatus.stages).map(([stage, status]) => {
          const isActive = status === 'in_progress';
          const isComplete = status === 'completed';
          const isFailed = status === 'failed';

          return (
            <div
              key={stage}
              className={`
                p-3 rounded-lg border transition-all duration-300
                ${isComplete ? 'bg-green-500/10 border-green-500/30' : ''}
                ${isActive ? 'bg-cyan-500/10 border-cyan-500/30 animate-pulse' : ''}
                ${isFailed ? 'bg-red-500/10 border-red-500/30' : ''}
                ${status === 'pending' ? 'bg-slate-700/50 border-slate-600' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {stageLabels[stage] || stage}
                </span>
                {isComplete && <span className="text-green-400">✓</span>}
                {isActive && <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />}
                {isFailed && <span className="text-red-400">✗</span>}
              </div>
              <div className={`
                text-xs mt-1
                ${isComplete ? 'text-green-400' : ''}
                ${isActive ? 'text-cyan-400' : ''}
                ${isFailed ? 'text-red-400' : ''}
                ${status === 'pending' ? 'text-slate-400' : ''}
              `}>
                {status === 'in_progress' ? 'Procesando...' : status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
