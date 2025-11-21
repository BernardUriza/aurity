"use client";

/**
 * SessionAuditPanel - Doctor review and feedback UI
 *
 * Allows doctor to:
 * - Review SOAP notes with inline corrections
 * - See orchestration steps (complexity, personas, confidence)
 * - View safety flags (low confidence, medication interactions)
 * - Submit rating and feedback (approve/reject/needs_review)
 *
 * Based on: docs/designs/patient-manager-feedback-design.md
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  FileText,
  Stethoscope,
  Brain,
  MessageSquare,
  Edit,
  Save,
  XCircle,
  Star,
  CheckCircle2,
  XOctagon,
  Clock,
  CornerDownRight,
} from 'lucide-react';

// Types
interface AuditData {
  session_id: string;
  patient: {
    id?: string;
    name?: string;
    age?: number;
    comorbidities?: string[];
  };
  session_metadata: {
    date: string;
    duration_seconds: number;
    doctor: string;
    status: 'pending_review' | 'approved' | 'rejected';
  };
  orchestration: {
    strategy: string;
    personas_invoked: string[];
    confidence_score: number;
    complexity_score: number;
    steps: OrchestrationStep[];
  };
  soap_note: {
    subjective?: string;
    objective?: string;
    assessment?: any;
    plan?: any;
  };
  diarization: {
    segments: any[];
  };
  flags: Flag[];
  doctor_feedback: any | null;
}

interface Flag {
  type: string;
  severity: 'critical' | 'warning';
  message: string;
  location: string;
}

interface OrchestrationStep {
  step: number;
  persona: string;
  timestamp: string;
  output: any;
  duration_ms?: number;
}

interface Correction {
  section: string;
  original: string;
  corrected: string;
  timestamp: string;
}

interface DoctorFeedback {
  rating: number | null;
  comments: string;
  corrections: Correction[];
}

interface SessionAuditPanelProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export function SessionAuditPanel({
  sessionId,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: SessionAuditPanelProps) {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'soap' | 'orchestration' | 'transcript'>('overview');
  const [feedback, setFeedback] = useState<DoctorFeedback>({
    rating: null,
    comments: '',
    corrections: [],
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch audit data
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    async function fetchAuditData() {
      try {
        setLoading(true);
        setError(null);

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
        const response = await fetch(`${backendUrl}/api/sessions/${sessionId}/audit`);

        if (!response.ok) {
          throw new Error(`Failed to fetch audit data: ${response.statusText}`);
        }

        const data = await response.json();
        setAuditData(data);
      } catch (err) {
        console.error('Failed to load audit data:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar auditoría');
      } finally {
        setLoading(false);
      }
    }

    fetchAuditData();
  }, [isOpen, sessionId]);

  // Submit feedback
  async function handleSubmit(decision: 'approved' | 'rejected' | 'needs_review') {
    if (!feedback.rating) {
      alert('Por favor califica la sesión (1-5 estrellas)');
      return;
    }

    try {
      setSubmitting(true);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
      const response = await fetch(`${backendUrl}/api/sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedback.rating,
          comments: feedback.comments,
          corrections: feedback.corrections,
          decision,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.statusText}`);
      }

      // Success!
      if (decision === 'approved' && onApprove) onApprove();
      if (decision === 'rejected' && onReject) onReject();

      onClose();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert(err instanceof Error ? err.message : 'Error al enviar feedback');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel - Slide-over from right */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] bg-slate-900 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Auditoría de Sesión
              </h2>
              {auditData && (
                <p className="text-sm text-slate-400 mt-1">
                  {auditData.patient.name || 'Paciente'} · {new Date(auditData.session_metadata.date).toLocaleDateString('es-MX')}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSubmit('approved')}
                disabled={!feedback.rating || submitting}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:opacity-50 rounded-lg text-white text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprobar
              </button>
              <button
                onClick={() => handleSubmit('rejected')}
                disabled={!feedback.rating || submitting}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:opacity-50 rounded-lg text-white text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <XOctagon className="w-4 h-4" />
                Rechazar
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Flags Banner */}
          {auditData && auditData.flags.length > 0 && (
            <div className="mt-4 space-y-2">
              {auditData.flags.map((flag, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-start gap-3 ${
                    flag.severity === 'critical'
                      ? 'bg-red-900/20 border-red-700'
                      : 'bg-yellow-900/20 border-yellow-700'
                  }`}
                >
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                    flag.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">
                      {flag.type.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div className="text-sm text-slate-300 mt-1">{flag.message}</div>
                    <div className="text-xs text-slate-500 mt-1">Ubicación: {flag.location}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {auditData && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview', icon: FileText },
                  { id: 'soap', label: 'SOAP', icon: Stethoscope },
                  { id: 'orchestration', label: 'Razonamiento IA', icon: Brain },
                  { id: 'transcript', label: 'Transcripción', icon: MessageSquare },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <OverviewTab data={auditData} />
              )}

              {activeTab === 'soap' && (
                <SOAPTab
                  soapNote={auditData.soap_note}
                  onCorrection={(correction) => {
                    setFeedback({
                      ...feedback,
                      corrections: [...feedback.corrections, correction],
                    });
                  }}
                />
              )}

              {activeTab === 'orchestration' && (
                <OrchestrationTab
                  orchestration={auditData.orchestration}
                />
              )}

              {activeTab === 'transcript' && (
                <TranscriptTab segments={auditData.diarization.segments} />
              )}

              {/* Feedback Form */}
              <div className="mt-8 pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Feedback del Doctor
                </h3>

                {/* Rating */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Calidad General del Procesamiento
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFeedback({ ...feedback, rating })}
                        className={`p-3 rounded-lg transition-all ${
                          feedback.rating === rating
                            ? 'bg-yellow-500 text-white scale-110'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${feedback.rating !== null && rating <= feedback.rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Comentarios Adicionales
                  </label>
                  <textarea
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Ej: El diagnóstico es correcto pero faltó mencionar el seguimiento a 3 meses..."
                    value={feedback.comments}
                    onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                  />
                </div>

                {/* Corrections Summary */}
                {feedback.corrections.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-950/20 border border-blue-900 rounded-lg">
                    <div className="text-sm font-semibold text-blue-400 mb-2">
                      Correcciones Aplicadas ({feedback.corrections.length})
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {feedback.corrections.map((corr, idx) => (
                        <li key={idx} className="break-words">
                          • {corr.section}: "{corr.original.substring(0, 30)}..." → "{corr.corrected.substring(0, 30)}..."
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper components (simplified versions - full implementations would be longer)

function OverviewTab({ data }: { data: AuditData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Estrategia" value={data.orchestration.strategy} color="blue" />
        <MetricCard label="Pasos" value={data.orchestration.personas_invoked.length} color="purple" />
        <MetricCard label="Confianza" value={`${(data.orchestration.confidence_score * 100).toFixed(0)}%`} color="emerald" />
        <MetricCard label="Complejidad" value={data.orchestration.complexity_score.toFixed(1)} color="amber" />
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
    </div>
  );
}

function SOAPTab({ soapNote, onCorrection }: { soapNote: any; onCorrection: (c: Correction) => void }) {
  return (
    <div className="space-y-4 text-slate-300">
      <p className="text-sm">SOAP editing implementation would go here (see design doc for details)</p>
      <pre className="p-4 bg-slate-800 rounded-lg text-xs overflow-x-auto">
        {JSON.stringify(soapNote, null, 2)}
      </pre>
    </div>
  );
}

function OrchestrationTab({ orchestration }: { orchestration: AuditData['orchestration'] }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-300">
        <strong>Estrategia:</strong> {orchestration.strategy}
      </div>
      <div className="text-sm text-slate-300">
        <strong>Personas Invoked:</strong> {orchestration.personas_invoked.join(' → ')}
      </div>
      {orchestration.steps.length > 0 && (
        <div className="space-y-3">
          {orchestration.steps.map((step, idx) => (
            <div key={idx} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="text-sm font-semibold text-white">
                Step {step.step}: {step.persona}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {new Date(step.timestamp).toLocaleTimeString('es-MX')}
              </div>
              {step.duration_ms && (
                <div className="text-xs text-slate-500 mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {step.duration_ms}ms
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TranscriptTab({ segments }: { segments: any[] }) {
  return (
    <div className="space-y-2">
      {segments.length === 0 && (
        <p className="text-slate-400 text-sm">No hay segmentos de diarización disponibles.</p>
      )}
      {segments.map((seg, idx) => (
        <div key={idx} className="p-3 bg-slate-800 rounded-lg">
          <div className="text-xs text-slate-500">{seg.speaker || 'Unknown'}</div>
          <div className="text-sm text-slate-300 mt-1">{seg.text || seg.transcript}</div>
        </div>
      ))}
    </div>
  );
}
