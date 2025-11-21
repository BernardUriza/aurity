'use client';

/**
 * Evidence Pack Viewer Component
 * Integrated into Medical AI Workflow
 * FI-DATA-RES-021: Evidence Packs Implementation
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Hash,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Quote,
  Activity
} from 'lucide-react';

interface Citation {
  citation_id: number;
  source_id: string;
  text: string;
  page_number?: number;
  confidence: number;
}

interface ClinicalSource {
  source_id: string;
  tipo_doc: string;
  fecha: string;
  paciente_id: string;
  hallazgo?: string;
  severidad?: string;
  raw_text?: string;
  citations?: Citation[];
}

interface EvidencePack {
  pack_id: string;
  created_at: string;
  session_id?: string;
  sources: ClinicalSource[];
  source_hashes: string[];
  policy_snapshot_id: string;
  citations?: Citation[];
  consulta?: string;
  response?: string;
}

interface EvidencePackViewerProps {
  sessionId?: string;
  onNext?: () => void;
  onPrevious?: () => void;
}

const DocumentTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons: { [key: string]: JSX.Element } = {
    transcripcion_audio: <Activity className="w-4 h-4 text-cyan-500" />,
    lab_result: <FileText className="w-4 h-4 text-blue-500" />,
    clinical_note: <FileText className="w-4 h-4 text-green-500" />,
    prescription: <FileText className="w-4 h-4 text-purple-500" />,
    imaging: <FileText className="w-4 h-4 text-amber-500" />,
  };
  return icons[type] || <FileText className="w-4 h-4 text-slate-400" />;
};

const SeverityBadge: React.FC<{ severity?: string }> = ({ severity }) => {
  if (!severity) return null;

  const colors = {
    leve: 'bg-green-500/10 text-green-400 border-green-500/30',
    moderada: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    grave: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${colors[severity as keyof typeof colors] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>
      {severity}
    </span>
  );
};

export function EvidencePackViewer({ sessionId, onNext, onPrevious }: EvidencePackViewerProps) {
  const [pack, setPack] = useState<EvidencePack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvidencePack = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch evidence pack from workflow API (auto-generates if not exists)
        const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
        const response = await fetch(
          `${apiBase}/api/workflows/aurity/sessions/${sessionId}/evidence`
        );

        if (!response.ok) {
          throw new Error(`Failed to load evidence pack: ${response.statusText}`);
        }

        const data = await response.json();
        setPack(data.evidence_pack);  // Backend wraps in { session_id, evidence_pack }

        console.log('[EvidencePackViewer] Loaded evidence pack:', data.evidence_pack.pack_id);
      } catch (err) {
        console.error('[EvidencePackViewer] Error loading evidence pack:', err);

        const errorMsg = err instanceof Error ? err.message : String(err);
        // Check if it's a "not found" error (expected when SOAP doesn't exist yet)
        const isNoDataError = errorMsg.includes('not found') ||
                             errorMsg.includes('404') ||
                             errorMsg.includes('does not exist');

        if (isNoDataError) {
          console.log('[EvidencePackViewer] Evidence pack not ready yet');
          setError('El Evidence Pack se generará cuando las notas SOAP estén disponibles');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load evidence pack');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvidencePack();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
              <p className="text-slate-400">Cargando Evidence Pack...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="py-8">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300 text-sm">
                {error || 'No se encontró Evidence Pack para esta sesión'}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={onPrevious}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl transition-all"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-white">Evidence Pack</CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  ID: {pack.pack_id}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                {pack.sources.length} fuente{pack.sources.length !== 1 ? 's' : ''}
              </Badge>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="h-3 w-3" />
                {new Date(pack.created_at).toLocaleDateString('es-MX')}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Clinical Question */}
      {pack.consulta && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Quote className="h-5 w-5 text-purple-400" />
              Consulta Clínica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 text-base leading-relaxed">
              {pack.consulta}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Evidence-Based Response */}
      {pack.response && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              Respuesta Basada en Evidencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed font-sans bg-slate-800/50 p-4 rounded-lg">
                {pack.response}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      <Card className="bg-slate-900/50 border-slate-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            Fuentes Clínicas ({pack.sources.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pack.sources.map((source, idx) => (
            <div
              key={source.source_id}
              className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <DocumentTypeIcon type={source.tipo_doc} />
                  <div>
                    <h3 className="text-white font-semibold">
                      {source.tipo_doc.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {new Date(source.fecha).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
                <SeverityBadge severity={source.severidad} />
              </div>

              {source.hallazgo && (
                <div className="mb-3">
                  <p className="text-sm text-slate-300">
                    {source.hallazgo}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs">
                <Hash className="h-3 w-3 text-slate-500" />
                <code className="text-slate-400 font-mono text-xs">
                  {pack.source_hashes[idx]?.slice(0, 16)}...
                </code>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Medical Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-amber-300 text-sm">
          <strong>Nota importante:</strong> Esta respuesta contiene únicamente evidencia extraída de los documentos fuente.
          No constituye un diagnóstico médico. Toda decisión clínica debe ser validada por un profesional de la salud.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevious}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-xl transition-all shadow-lg shadow-cyan-500/20"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
