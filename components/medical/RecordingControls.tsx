/**
 * RecordingControls Component
 *
 * Main recording button with pause/resume functionality.
 *
 * Features:
 * - Start/Pause/Resume recording
 * - Heartbeat animation when recording
 * - Pulse rings visual feedback
 * - Recording time display
 * - End Session button (when paused)
 * - Status text
 * - Debounce protection (prevents double-click)
 *
 * Extracted from ConversationCapture (Phase 7)
 * Updated: Pause/Resume mode (2025-11-13)
 * Fixed: Double-click protection (2025-11-15)
 */

import { useState } from 'react';
import { Mic, Pause, Play, Loader2 } from 'lucide-react';
import { formatTime } from '@/lib/audio/formatting';
import type { TranscriptionData } from '@/hooks/useTranscription';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  recordingTime: number;
  transcriptionData: TranscriptionData | null;
  chunkCount: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEndSession: () => void;
}

export function RecordingControls({
  isRecording,
  isPaused,
  isProcessing,
  recordingTime,
  transcriptionData,
  chunkCount,
  onStart,
  onPause,
  onResume,
  onEndSession,
}: RecordingControlsProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleClick = async () => {
    // Prevent double-click
    if (isTransitioning || isProcessing) {
      console.warn('[RecordingControls] Ignoring click - already transitioning');
      return;
    }

    setIsTransitioning(true);

    try {
      if (isPaused) {
        await onResume();
      } else if (isRecording) {
        await onPause();
      } else {
        await onStart();
      }
    } finally {
      // Reset after 1 second to allow state to update
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  const isDisabled = isProcessing || isTransitioning;

  return (
    <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
      <div className="flex flex-col items-center gap-6">
        {/* Main Control Button */}
        <div className="relative">
          <button
            onClick={handleClick}
            disabled={isDisabled}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center transition-all relative z-10
              ${isTransitioning
                ? 'bg-cyan-500'
                : isRecording
                ? 'bg-yellow-500 hover:bg-yellow-600 animate-heartbeat'
                : isPaused
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              shadow-lg hover:shadow-xl
            `}
          >
            {isTransitioning ? (
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            ) : isPaused ? (
              <Play className="h-10 w-10 text-white" />
            ) : isRecording ? (
              <Pause className="h-10 w-10 text-white" />
            ) : (
              <Mic className="h-10 w-10 text-white" />
            )}
          </button>

          {/* Pulse Rings - Only when recording */}
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-30 pointer-events-none" />
              <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-20 pointer-events-none"
                   style={{
                     animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                   }} />
            </>
          )}
        </div>

        {/* Recording Time - Show during recording or when paused */}
        {(isRecording || isPaused) && recordingTime > 0 && (
          <div className="text-3xl font-mono text-white">
            {formatTime(recordingTime)}
          </div>
        )}

        {/* Status Text */}
        <div className="text-center min-h-[28px]">
          {isTransitioning && (
            <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="font-medium">
                {isRecording ? 'Pausando grabación...' : isPaused ? 'Reanudando...' : 'Iniciando...'}
              </p>
            </div>
          )}
          {!isTransitioning && isRecording && (
            <p className="text-yellow-400 font-medium">Grabando... (Click para pausar)</p>
          )}
          {!isTransitioning && isPaused && (
            <p className="text-emerald-400 font-medium">Pausado (Click para reanudar)</p>
          )}
          {!isTransitioning && isProcessing && (
            <div className="flex items-center gap-2 text-cyan-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="font-medium">Procesando audio...</p>
            </div>
          )}
          {!isTransitioning && !isRecording && !isPaused && !isProcessing && !transcriptionData && (
            <p className="text-slate-400">Presiona para comenzar a grabar</p>
          )}
        </div>
      </div>
    </div>
  );
}
