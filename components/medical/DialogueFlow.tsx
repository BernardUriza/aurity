'use client';

/**
 * DialogueFlow Component - AURITY Medical Workflow
 *
 * Review and edit conversation transcription with speaker diarization.
 * Integrates with FI backend consultation results.
 *
 * Features:
 * - Display speaker-separated dialogue
 * - Edit transcription text
 * - Navigate between speakers
 * - Load real diarization segments from HDF5
 *
 * File: apps/aurity/components/medical/DialogueFlow.tsx
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Edit2, Save, User, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { medicalWorkflowApi, type DiarizationSegment } from '@/lib/api/medical-workflow';
import { isDoctor, isPatient } from '@/lib/constants/speakers';

interface DialogueFlowProps {
  onNext?: () => void;
  onPrevious?: () => void;
  sessionId?: string; // Session ID to load diarization segments
  className?: string;
}

interface DialogueEntry {
  speaker: string;
  text: string;
  timestamp?: string;
}

export function DialogueFlow({
  onNext,
  onPrevious,
  sessionId,
  className = ''
}: DialogueFlowProps) {
  // State
  const [dialogue, setDialogue] = useState<DialogueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // Load real diarization segments from backend
  useEffect(() => {
    if (!sessionId) {
      // No session ID, show empty state
      setDialogue([]);
      return;
    }

    const loadSegments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await medicalWorkflowApi.getDiarizationSegments(sessionId);

        // Convert backend segments to DialogueEntry format
        const entries: DialogueEntry[] = response.segments.map((seg: DiarizationSegment) => ({
          speaker: seg.speaker, // MEDICO | PACIENTE | DESCONOCIDO
          text: seg.improved_text || seg.text, // Use improved_text if available
          timestamp: formatTimestamp(seg.start_time),
        }));

        setDialogue(entries);
      } catch (err) {
        console.error('[DialogueFlow] Failed to load segments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load diarization segments');
      } finally {
        setIsLoading(false);
      }
    };

    loadSegments();
  }, [sessionId]);

  // Format seconds to MM:SS
  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle edit
  const handleEdit = (index: number) => {
    setIsEditing(index);
    setEditText(dialogue[index].text);
  };

  // Handle save
  const handleSave = (index: number) => {
    const updated = [...dialogue];
    updated[index].text = editText;
    setDialogue(updated);
    setIsEditing(null);
  };

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(null);
    setEditText('');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Revisión del Diálogo</h2>
        <p className="text-slate-400">
          {sessionId
            ? 'Revisa y edita la conversación transcrita con diarización real'
            : 'Carga una sesión con diarización completada'}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-slate-400">Cargando segmentos de diarización...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 rounded-xl p-6 border border-red-700/30 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Error al cargar segmentos</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && dialogue.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
          <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay segmentos de diarización disponibles</p>
          <p className="text-slate-500 text-sm mt-2">
            {sessionId
              ? 'La diarización puede estar en progreso o no completada'
              : 'Proporciona un session_id para cargar los datos'}
          </p>
        </div>
      )}

      {/* Dialogue Container */}
      {!isLoading && !error && dialogue.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="space-y-4">
          {dialogue.map((entry, index) => (
            <div
              key={index}
              className={`
                p-4 rounded-lg border transition-all
                ${entry.speaker === 'Doctor'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-cyan-500/10 border-cyan-500/30'
                }
              `}
            >
              {/* Speaker Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className={`h-4 w-4 ${
                    entry.speaker === 'Doctor' ? 'text-emerald-400' : 'text-cyan-400'
                  }`} />
                  <span className="font-semibold text-white">{entry.speaker}</span>
                  {entry.timestamp && (
                    <span className="text-xs text-slate-400">{entry.timestamp}</span>
                  )}
                </div>

                {/* Edit Button */}
                {isEditing !== index && (
                  <button
                    onClick={() => handleEdit(index)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              {isEditing === index ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-slate-900 text-white p-3 rounded border border-slate-700 focus:border-emerald-500 focus:outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(index)}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors text-sm"
                    >
                      <Save className="h-4 w-4" />
                      Guardar
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-300">{entry.text}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Summary Stats - Only show when dialogue loaded */}
      {!isLoading && !error && dialogue.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <div className="text-2xl font-bold text-emerald-400">{dialogue.length}</div>
            <div className="text-sm text-slate-400">Intercambios</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {dialogue.filter(d => isDoctor(d.speaker)).length}
            </div>
            <div className="text-sm text-slate-400">Médico</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {dialogue.filter(d => isPatient(d.speaker)).length}
            </div>
            <div className="text-sm text-slate-400">Paciente</div>
          </div>
        </div>
      )}

      {/* Navigation */}
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
    </div>
  );
}
