'use client';

/**
 * DialogueFlow Component - Refactored with EventTimeline
 *
 * Medical conversation review with speaker diarization.
 * Now using reusable EventTimeline component with dialogFlowConfig.
 *
 * Features:
 * ✅ Speaker diarization (MEDICO/PACIENTE)
 * ✅ Audio playback sync
 * ✅ Edit functionality
 * ✅ Search/filter/export (via EventTimeline)
 * ✅ Auto-diarization when not found
 *
 * Refactored: 2025-11-18 (793 lines → ~250 lines)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  MessageSquare,
  User,
} from 'lucide-react';
import { medicalWorkflowApi, type DiarizationSegment } from '@/lib/api/medical-workflow';
import { APIError } from '@/lib/api/client';
import { EventTimeline, type TimelineEvent } from '@/components/EventTimeline';
import { dialogFlowConfig } from '@/lib/dialogflow-config';

// ============================================================================
// Types
// ============================================================================

interface DialogueFlowProps {
  onNext?: () => void;
  onPrevious?: () => void;
  sessionId?: string;
  audioUrl?: string | null;
  className?: string;
}

interface EnhancedSegment extends DiarizationSegment {
  id: string;
  duration: number;
}

// ============================================================================
// Main Component
// ============================================================================

export function DialogueFlow({
  onNext,
  onPrevious,
  sessionId,
  audioUrl,
  className = '',
}: DialogueFlowProps) {
  // ========================================
  // State Management
  // ========================================

  const [segments, setSegments] = useState<EnhancedSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('');
  const [completedAt, setCompletedAt] = useState<string>('');

  // Auto-diarization states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Audio refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // ========================================
  // Data Loading
  // ========================================

  useEffect(() => {
    if (!sessionId) {
      setSegments([]);
      return;
    }

    const loadSegments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await medicalWorkflowApi.getDiarizationSegments(sessionId);

        // Enhance segments with computed fields
        const enhanced: EnhancedSegment[] = response.segments.map((seg, idx) => ({
          ...seg,
          id: `seg-${idx}`,
          duration: seg.end_time - seg.start_time,
        }));

        setSegments(enhanced);
        setProvider(response.provider);
        setCompletedAt(response.completed_at);
      } catch (err: any) {
        console.error('[DialogueFlow] Failed to load segments:', err);

        // Check if 404 - diarization doesn't exist yet
        const is404 = (err instanceof APIError && err.status === 404) ||
                      err?.message?.includes('not found') ||
                      err?.message?.includes('Diarization task not found');

        if (is404) {
          console.log('[DialogueFlow] Diarization not found, starting automatically...');
          await startDiarizationAutomatically();
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load segments');
        }
      } finally {
        setIsLoading(false);
      }
    };

    const startDiarizationAutomatically = async () => {
      try {
        setIsProcessing(true);
        setProcessingStatus('Iniciando diarización...');

        // Start diarization task
        const jobResponse = await medicalWorkflowApi.startDiarization(sessionId);
        setJobId(jobResponse.job_id);
        setProcessingStatus(`Procesando speakers (Job: ${jobResponse.job_id})...`);

        // Poll for completion
        const pollInterval = setInterval(async () => {
          try {
            const status = await medicalWorkflowApi.getDiarizationStatus(jobResponse.job_id);
            setProcessingStatus(`Estado: ${status.status} (${status.progress || 0}%)`);

            if (status.status === 'completed') {
              clearInterval(pollInterval);
              setIsProcessing(false);
              setProcessingStatus('');
              await loadSegments();
            } else if (status.status === 'failed') {
              clearInterval(pollInterval);
              setIsProcessing(false);
              setError('Diarization failed: ' + (status.error || 'Unknown error'));
            }
          } catch (pollErr) {
            console.error('[DialogueFlow] Polling error:', pollErr);
          }
        }, 3000);

        return () => clearInterval(pollInterval);
      } catch (err) {
        console.error('[DialogueFlow] Failed to start diarization:', err);
        setIsProcessing(false);
        setError('Failed to start diarization automatically');
      }
    };

    loadSegments();
  }, [sessionId]);

  // ========================================
  // Transform to TimelineEvent Format
  // ========================================

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    return segments.map((seg) => ({
      id: seg.id,
      timestamp: seg.start_time,
      type: seg.speaker,
      content: seg.text,
      metadata: {
        speaker: seg.speaker,
        start_time: seg.start_time,
        end_time: seg.end_time,
        confidence: seg.confidence,
        improved_text: seg.improved_text,
        duration: seg.duration,
      },
    }));
  }, [segments]);

  // ========================================
  // Stats
  // ========================================

  const stats = useMemo(() => {
    const total = segments.length;
    const medico = segments.filter((s) => {
      const speaker = s.speaker.toLowerCase();
      return speaker === 'medico' || speaker === 'doctor';
    }).length;
    const paciente = segments.filter((s) => {
      const speaker = s.speaker.toLowerCase();
      return speaker === 'paciente' || speaker === 'patient';
    }).length;
    const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);

    return { total, medico, paciente, totalDuration };
  }, [segments]);

  // ========================================
  // Event Handlers
  // ========================================

  const handleEdit = useCallback((event: TimelineEvent) => {
    setEditingId(event.id);
    setEditText(event.content);
  }, []);

  const handleSave = useCallback(
    async (id: string) => {
      if (!sessionId) return;

      const segmentIndex = parseInt(id.split('-')[1], 10);

      try {
        await medicalWorkflowApi.updateSegmentText(sessionId, segmentIndex, editText);

        // Update local state
        setSegments((prev) =>
          prev.map((seg) =>
            seg.id === id ? { ...seg, text: editText } : seg
          )
        );

        setEditingId(null);
      } catch (err) {
        console.error('[DialogueFlow] Failed to save segment edit:', err);
        alert('Error al guardar la edición. Por favor intenta de nuevo.');
      }
    },
    [editText, sessionId]
  );

  const handleAudioPlay = useCallback((event: TimelineEvent) => {
    if (audioRef.current && event.metadata?.start_time) {
      audioRef.current.currentTime = event.metadata.start_time;
      audioRef.current.play();
    }
  }, []);

  const handleAudioTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // ========================================
  // Config with Actions
  // ========================================

  const configWithActions = useMemo(() => ({
    ...dialogFlowConfig,
    actions: {
      onEdit: handleEdit,
      onPlay: handleAudioPlay,
    },
  }), [handleEdit, handleAudioPlay]);

  // ========================================
  // Utility Functions
  // ========================================

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ========================================
  // Render
  // ========================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ===== Header with Stats ===== */}
      {!isLoading && segments.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Revisión del Diálogo</h2>
              <p className="text-sm text-slate-400">
                {stats.total} segmentos • {formatTime(stats.totalDuration)}
              </p>
            </div>
          </div>

          {/* Speaker Legend */}
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-md">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-blue-400 font-medium">MÉDICO ({stats.medico})</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-xs text-emerald-400 font-medium">PACIENTE ({stats.paciente})</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== Processing State (Auto-Diarization) ===== */}
      {isProcessing && (
        <div className="bg-cyan-900/20 rounded-xl p-6 border border-cyan-700/30 flex items-center gap-3">
          <Loader2 className="h-6 w-6 text-cyan-400 flex-shrink-0 animate-spin" />
          <div>
            <p className="text-cyan-400 font-medium">Diarización automática en progreso</p>
            <p className="text-cyan-400/80 text-sm mt-1">
              {processingStatus || 'Separando speakers en el audio...'}
            </p>
            {jobId && (
              <p className="text-cyan-400/60 text-xs mt-1">Job ID: {jobId}</p>
            )}
          </div>
        </div>
      )}

      {/* ===== Error State ===== */}
      {error && !isProcessing && (
        <div className="bg-red-900/20 rounded-xl p-6 border border-red-700/30 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Error al cargar segmentos</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ===== Empty State ===== */}
      {!isLoading && !error && !isProcessing && segments.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
          <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay segmentos de diarización disponibles</p>
          <p className="text-slate-500 text-sm mt-2">
            {sessionId
              ? 'La diarización puede estar en progreso'
              : 'Proporciona un session_id'}
          </p>
        </div>
      )}

      {/* ===== Audio Player (if available) ===== */}
      {audioUrl && !isLoading && segments.length > 0 && (
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <audio
            ref={audioRef}
            controls
            className="w-full"
            src={audioUrl}
            onTimeUpdate={handleAudioTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            Tu navegador no soporta reproducción de audio.
          </audio>
          <p className="text-xs text-slate-500 mt-2">
            💡 Haz clic en los timestamps para navegar al momento exacto
          </p>
        </div>
      )}

      {/* ===== EventTimeline Component (Replaces 400+ lines of manual rendering) ===== */}
      <EventTimeline
        events={timelineEvents}
        config={configWithActions}
        isLoading={isLoading}
        error={error}
        className="bg-transparent"
      />

      {/* ===== Footer Metadata ===== */}
      {!isLoading && !error && segments.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>
                <strong className="text-slate-300">Provider:</strong> {provider}
              </span>
              {completedAt && (
                <span>
                  <strong className="text-slate-300">Completado:</strong>{' '}
                  {new Date(completedAt).toLocaleString('es-MX')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Navigation ===== */}
      {!isLoading && segments.length > 0 && (
        <div className="flex gap-4">
          {onPrevious && (
            <button
              onClick={onPrevious}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Anterior
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Continuar
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
