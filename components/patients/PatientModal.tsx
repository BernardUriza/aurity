/**
 * PatientModal Component
 *
 * Modal wrapper for creating/editing patients
 * Handles API calls and state management
 *
 * @example
 * <PatientModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={(patient) => console.log('Created:', patient)}
 * />
 */

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { PatientForm } from './PatientForm';
import { createPatient, updatePatient, type PatientCreate, type Patient } from '@/lib/api/patients';

export interface PatientModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when patient is successfully created/updated */
  onSuccess: (patient: Patient) => void;
  /** Patient to edit (when in edit mode) */
  patient?: Patient;
  /** Initial data for edit mode */
  initialData?: Partial<PatientCreate>;
  /** Modal mode */
  mode?: 'create' | 'edit';
}

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patient,
  initialData,
  mode = 'create',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (data: PatientCreate) => {
    setLoading(true);
    setError(null);

    try {
      let result: Patient;

      if (mode === 'edit' && patient) {
        // Update existing patient
        result = await updatePatient(patient.id, data);
      } else {
        // Create new patient
        result = await createPatient(data);
      }

      onSuccess(result);
      onClose();
    } catch (err) {
      console.error(`Failed to ${mode} patient:`, err);
      setError(err instanceof Error ? err.message : `Error al ${mode === 'edit' ? 'actualizar' : 'crear'} paciente`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {mode === 'create' ? 'Nuevo Paciente' : 'Editar Paciente'}
              </h2>
              <p className="text-sm text-slate-400">
                {mode === 'create' ? 'Registra un nuevo paciente' : 'Actualiza información del paciente'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-300">Error</p>
              <p className="text-sm text-red-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-6">
          <PatientForm
            onSubmit={handleSubmit}
            onCancel={handleClose}
            initialData={initialData}
            mode={mode}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
