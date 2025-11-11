'use client';

/**
 * ClinicalNotes Component - AURITY Medical Workflow
 *
 * SOAP notes (Subjective, Objective, Assessment, Plan) editor.
 * Integrates with FI backend SOAP generation via Ollama.
 *
 * Features:
 * - Display AI-generated SOAP notes
 * - Edit and format clinical notes
 * - Validate completeness
 *
 * File: apps/aurity/components/medical/ClinicalNotes.tsx
 */

import React, { useState } from 'react';
import { FileText, Save, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface ClinicalNotesProps {
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
}

interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export function ClinicalNotes({
  onNext,
  onPrevious,
  className = ''
}: ClinicalNotesProps) {
  // State
  const [soapNotes, setSOAPNotes] = useState<SOAPNotes>({
    subjective: 'Paciente masculino de 45 años refiere cefalea persistente de 3 días de evolución. Dolor de intensidad moderada (6/10), predominantemente matutino, sin irradiación. Niega náuseas o fotofobia.',
    objective: 'TA: 130/85 mmHg, FC: 78 lpm, FR: 16 rpm, Temp: 36.8°C. Alerta y orientado. Examen neurológico sin alteraciones. Pupilas isocóricas reactivas. No rigidez de nuca. Fondo de ojo sin papiledema.',
    assessment: 'Cefalea tensional probable. Descartar hipertensión arterial como factor contribuyente. Sin datos de alarma neurológica.',
    plan: 'Iniciar paracetamol 500mg cada 8 horas por 5 días. Técnicas de relajación y manejo de estrés. Control en 7 días o antes si empeoran síntomas. Solicitar perfil de presión arterial ambulatorio.'
  });

  const [isSaved, setIsSaved] = useState(false);
  const [editingSection, setEditingSection] = useState<keyof SOAPNotes | null>(null);

  // Handle edit
  const handleEdit = (section: keyof SOAPNotes, value: string) => {
    setSOAPNotes(prev => ({
      ...prev,
      [section]: value
    }));
    setIsSaved(false);
  };

  // Handle save
  const handleSave = () => {
    setIsSaved(true);
    setEditingSection(null);
    // TODO: Send to FI backend for persistence
    console.log('Saving SOAP notes:', soapNotes);
  };

  // Check completeness
  const isComplete = Object.values(soapNotes).every(value => value.trim().length > 0);

  // Section config
  const sections: Array<{
    key: keyof SOAPNotes;
    title: string;
    color: string;
    icon: string;
  }> = [
    { key: 'subjective', title: 'Subjetivo', color: 'emerald', icon: '🗣️' },
    { key: 'objective', title: 'Objetivo', color: 'cyan', icon: '📊' },
    { key: 'assessment', title: 'Evaluación', color: 'purple', icon: '🔍' },
    { key: 'plan', title: 'Plan', color: 'amber', icon: '📋' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Notas Clínicas SOAP</h2>
        <p className="text-slate-400">Revisa y edita las notas clínicas generadas</p>
      </div>

      {/* Completeness Indicator */}
      <div className={`
        p-4 rounded-lg border flex items-center gap-3
        ${isComplete
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
        }
      `}>
        {isComplete ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-medium">Notas completas</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <span className="text-amber-400 font-medium">Completa todas las secciones</span>
          </>
        )}
      </div>

      {/* SOAP Sections */}
      <div className="space-y-4">
        {sections.map(section => (
          <div
            key={section.key}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{section.icon}</span>
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
              </div>
              {editingSection !== section.key && (
                <button
                  onClick={() => setEditingSection(section.key)}
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Editar
                </button>
              )}
            </div>

            {/* Section Content */}
            {editingSection === section.key ? (
              <div className="space-y-2">
                <textarea
                  value={soapNotes[section.key]}
                  onChange={(e) => handleEdit(section.key, e.target.value)}
                  className={`
                    w-full bg-slate-900 text-white p-4 rounded border focus:outline-none resize-none
                    border-${section.color}-500/30 focus:border-${section.color}-500
                  `}
                  rows={4}
                  placeholder={`Ingresa ${section.title.toLowerCase()}...`}
                />
                <button
                  onClick={() => setEditingSection(null)}
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Listo
                </button>
              </div>
            ) : (
              <p className="text-slate-300 whitespace-pre-wrap">{soapNotes[section.key]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!isComplete}
        className={`
          w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all
          ${isComplete
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        <Save className="h-5 w-5" />
        {isSaved ? 'Notas Guardadas' : 'Guardar Notas'}
      </button>

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
            disabled={!isComplete}
            className={`
              flex-1 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2
              ${isComplete
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            Continuar
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
