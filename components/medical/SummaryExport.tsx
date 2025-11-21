'use client';

/**
 * SummaryExport Component - AURITY Medical Workflow
 *
 * Final summary and export options for consultation data.
 * Integrates with FI backend export services.
 *
 * Features:
 * - Display consultation summary
 * - Export to PDF/Markdown
 * - Send to HDF5 corpus
 *
 * File: apps/aurity/components/medical/SummaryExport.tsx
 */

import React, { useState } from 'react';
import { Download, FileText, Database, Check, Loader2, Archive } from 'lucide-react';

interface SummaryExportProps {
  onPrevious?: () => void;
  onComplete?: () => void;
  className?: string;
}

interface ConsultationSummary {
  patient: string;
  date: string;
  duration: string;
  transcriptionLength: number;
  soapComplete: boolean;
  ordersCount: number;
}

export function SummaryExport({
  onPrevious,
  onComplete,
  className = ''
}: SummaryExportProps) {
  // State
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'markdown' | 'corpus'>('corpus');

  // Summary data (would come from workflow context)
  const summary: ConsultationSummary = {
    patient: 'Juan Pérez',
    date: new Date().toLocaleString('es-MX'),
    duration: '00:08:23',
    transcriptionLength: 1247,
    soapComplete: true,
    ordersCount: 3
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Call FI backend export service
      console.log('Exporting consultation data to:', exportFormat);

      setExportComplete(true);

      // Auto-complete after 1 second
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1000);

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Resumen y Exportación</h2>
        <p className="text-slate-400">Revisa el resumen y guarda la consulta</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Paciente</div>
          <div className="text-xl font-semibold text-white">{summary.patient}</div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Duración</div>
          <div className="text-xl font-semibold text-emerald-400">{summary.duration}</div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Transcripción</div>
          <div className="text-xl font-semibold text-cyan-400">
            {summary.transcriptionLength} caracteres
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Órdenes</div>
          <div className="text-xl font-semibold text-purple-400">{summary.ordersCount}</div>
        </div>
      </div>

      {/* Completeness Check */}
      <div className={`
        p-4 rounded-lg border flex items-center gap-3
        ${summary.soapComplete
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
        }
      `}>
        {summary.soapComplete ? (
          <>
            <Check className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-medium">Consulta completa y lista para exportar</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <span className="text-amber-400 font-medium">Faltan datos por completar</span>
          </>
        )}
      </div>

      {/* Export Options */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Formato de Exportación</h3>

        <div className="space-y-3">
          {/* Corpus (HDF5) */}
          <button
            onClick={() => setExportFormat('corpus')}
            className={`
              w-full p-4 rounded-lg border transition-all text-left flex items-center gap-4
              ${exportFormat === 'corpus'
                ? 'bg-emerald-500/20 border-emerald-500'
                : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
              }
            `}
          >
            <Database className={`h-6 w-6 ${
              exportFormat === 'corpus' ? 'text-emerald-400' : 'text-slate-400'
            }`} />
            <div className="flex-1">
              <div className="font-medium text-white">Corpus HDF5</div>
              <div className="text-sm text-slate-400">
                Almacenamiento inmutable con provenance completo
              </div>
            </div>
            {exportFormat === 'corpus' && (
              <Check className="h-5 w-5 text-emerald-400" />
            )}
          </button>

          {/* PDF */}
          <button
            onClick={() => setExportFormat('pdf')}
            className={`
              w-full p-4 rounded-lg border transition-all text-left flex items-center gap-4
              ${exportFormat === 'pdf'
                ? 'bg-emerald-500/20 border-emerald-500'
                : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
              }
            `}
          >
            <FileText className={`h-6 w-6 ${
              exportFormat === 'pdf' ? 'text-emerald-400' : 'text-slate-400'
            }`} />
            <div className="flex-1">
              <div className="font-medium text-white">PDF</div>
              <div className="text-sm text-slate-400">
                Documento imprimible para archivo físico
              </div>
            </div>
            {exportFormat === 'pdf' && (
              <Check className="h-5 w-5 text-emerald-400" />
            )}
          </button>

          {/* Markdown */}
          <button
            onClick={() => setExportFormat('markdown')}
            className={`
              w-full p-4 rounded-lg border transition-all text-left flex items-center gap-4
              ${exportFormat === 'markdown'
                ? 'bg-emerald-500/20 border-emerald-500'
                : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
              }
            `}
          >
            <Archive className={`h-6 w-6 ${
              exportFormat === 'markdown' ? 'text-emerald-400' : 'text-slate-400'
            }`} />
            <div className="flex-1">
              <div className="font-medium text-white">Markdown</div>
              <div className="text-sm text-slate-400">
                Formato de texto plano legible
              </div>
            </div>
            {exportFormat === 'markdown' && (
              <Check className="h-5 w-5 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Export Success */}
      {exportComplete && (
        <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/30 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-400" />
          <span className="text-green-400 font-medium">
            Consulta exportada exitosamente al corpus FI
          </span>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting || exportComplete || !summary.soapComplete}
        className={`
          w-full py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all
          ${isExporting || exportComplete || !summary.soapComplete
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }
        `}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Exportando...
          </>
        ) : exportComplete ? (
          <>
            <Check className="h-5 w-5" />
            Exportado
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            Exportar Consulta
          </>
        )}
      </button>

      {/* Navigation */}
      <div className="flex gap-4">
        {onPrevious && !exportComplete && (
          <button
            onClick={onPrevious}
            disabled={isExporting}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            Anterior
          </button>
        )}
      </div>
    </div>
  );
}
