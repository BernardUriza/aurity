'use client';

/**
 * Patient Info Modal - Pre-Consultation Form
 *
 * Captures required patient information before starting a medical recording.
 * Data is saved to HDF5 session metadata.
 *
 * Created: 2025-11-17
 */

import React, { useState } from 'react';
import { X, User, Calendar, FileText, AlertCircle } from 'lucide-react';

interface PatientInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patientInfo: PatientInfo) => void;
}

export interface PatientInfo {
  patient_name: string;
  patient_age?: string;
  patient_id?: string;
  chief_complaint?: string;
}

export function PatientInfoModal({ isOpen, onClose, onSubmit }: PatientInfoModalProps) {
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientId, setPatientId] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required field
    if (!patientName.trim()) {
      setError('El nombre del paciente es obligatorio');
      return;
    }

    // Submit patient info
    onSubmit({
      patient_name: patientName.trim(),
      patient_age: patientAge.trim() || undefined,
      patient_id: patientId.trim() || undefined,
      chief_complaint: chiefComplaint.trim() || undefined,
    });

    // Reset form
    setPatientName('');
    setPatientAge('');
    setPatientId('');
    setChiefComplaint('');
    setError('');
  };

  const handleCancel = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Información del Paciente</h2>
              <p className="text-sm text-slate-400">Requerido antes de iniciar la consulta</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Patient Name (Required) */}
          <div>
            <label htmlFor="patient-name" className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del Paciente <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="patient-name"
                type="text"
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  setError('');
                }}
                placeholder="Ej: María González López"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Patient Age (Optional) */}
          <div>
            <label htmlFor="patient-age" className="block text-sm font-medium text-slate-300 mb-2">
              Edad <span className="text-slate-500 text-xs">(opcional)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="patient-age"
                type="text"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Ej: 42 años"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Patient ID / Expediente (Optional) */}
          <div>
            <label htmlFor="patient-id" className="block text-sm font-medium text-slate-300 mb-2">
              No. Expediente <span className="text-slate-500 text-xs">(opcional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="patient-id"
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Ej: EXP-2024-001234"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Chief Complaint (Optional) */}
          <div>
            <label htmlFor="chief-complaint" className="block text-sm font-medium text-slate-300 mb-2">
              Motivo de Consulta <span className="text-slate-500 text-xs">(opcional)</span>
            </label>
            <textarea
              id="chief-complaint"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="Ej: Dolor de cabeza intenso desde hace 3 días"
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/25"
            >
              Iniciar Consulta
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="px-6 pb-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400">
              💡 Esta información se guarda de forma segura en el expediente electrónico y
              facilita la identificación de la consulta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
