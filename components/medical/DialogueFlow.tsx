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
 *
 * File: apps/aurity/components/medical/DialogueFlow.tsx
 */

import React, { useState } from 'react';
import { MessageSquare, Edit2, Save, User, ChevronRight } from 'lucide-react';

interface DialogueFlowProps {
  onNext?: () => void;
  onPrevious?: () => void;
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
  className = ''
}: DialogueFlowProps) {
  // State
  const [dialogue, setDialogue] = useState<DialogueEntry[]>([
    { speaker: 'Doctor', text: 'Buenos días. ¿Cómo se encuentra hoy?', timestamp: '00:00' },
    { speaker: 'Paciente', text: 'Buenos días doctor. Me he sentido con dolor de cabeza los últimos días.', timestamp: '00:05' },
    { speaker: 'Doctor', text: '¿Desde cuándo tiene el dolor? ¿Es constante o intermitente?', timestamp: '00:12' },
    { speaker: 'Paciente', text: 'Comenzó hace como 3 días. Es más fuerte por las mañanas.', timestamp: '00:18' },
  ]);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

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
        <p className="text-slate-400">Revisa y edita la conversación transcrita</p>
      </div>

      {/* Dialogue Container */}
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

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
          <div className="text-2xl font-bold text-emerald-400">{dialogue.length}</div>
          <div className="text-sm text-slate-400">Intercambios</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
          <div className="text-2xl font-bold text-cyan-400">
            {dialogue.filter(d => d.speaker === 'Doctor').length}
          </div>
          <div className="text-sm text-slate-400">Doctor</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {dialogue.filter(d => d.speaker === 'Paciente').length}
          </div>
          <div className="text-sm text-slate-400">Paciente</div>
        </div>
      </div>

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
