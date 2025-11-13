/**
 * RecordingControls Component
 *
 * Main recording button with heartbeat animation and pulse rings.
 *
 * Features:
 * - Start/Stop recording toggle
 * - Heartbeat animation when recording
 * - Pulse rings visual feedback
 * - Recording time display
 * - Status text
 *
 * Extracted from ConversationCapture (Phase 7)
 */

import { Mic, MicOff, Loader2 } from 'lucide-react';
import { formatTime } from '@/lib/audio/formatting';
import type { TranscriptionData } from '@/hooks/useTranscription';

interface RecordingControlsProps {
  isRecording: boolean;
  isProcessing: boolean;
  recordingTime: number;
  transcriptionData: TranscriptionData | null;
  onStart: () => void;
  onStop: () => void;
}

export function RecordingControls({
  isRecording,
  isProcessing,
  recordingTime,
  transcriptionData,
  onStart,
  onStop,
}: RecordingControlsProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
      <div className="flex flex-col items-center gap-6">
        {/* Recording Button with Heartbeat Animation */}
        <div className="relative">
          <button
            onClick={isRecording ? onStop : onStart}
            disabled={isProcessing}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center transition-all relative z-10
              ${isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-heartbeat'
                : 'bg-emerald-500 hover:bg-emerald-600'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              shadow-lg hover:shadow-xl
            `}
          >
            {isRecording ? (
              <MicOff className="h-10 w-10 text-white" />
            ) : (
              <Mic className="h-10 w-10 text-white" />
            )}
          </button>

          {/* Pulse Rings - Only when recording */}
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30 pointer-events-none" />
              <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 pointer-events-none"
                   style={{
                     animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                   }} />
            </>
          )}
        </div>

        {/* Recording Time */}
        {isRecording && (
          <div className="text-3xl font-mono text-white">
            {formatTime(recordingTime)}
          </div>
        )}

        {/* Status Text */}
        <div className="text-center">
          {isRecording && (
            <p className="text-emerald-400 font-medium">Grabando...</p>
          )}
          {isProcessing && (
            <div className="flex items-center gap-2 text-cyan-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="font-medium">Procesando audio...</p>
            </div>
          )}
          {!isRecording && !isProcessing && !transcriptionData && (
            <p className="text-slate-400">Presiona para comenzar a grabar</p>
          )}
        </div>
      </div>
    </div>
  );
}
