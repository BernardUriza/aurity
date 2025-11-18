/**
 * PatientCard Component
 *
 * SOLID Principle: Single Responsibility
 * - Only responsible for rendering a SINGLE patient card
 * - No business logic, only presentation
 * - Receives patient data and onClick callback (Dependency Inversion)
 *
 * @example
 * <PatientCard
 *   patient={patientData}
 *   onClick={(patient) => handleSelectPatient(patient)}
 * />
 */

import React from 'react';
import { ChevronRight, AlertCircle, Activity } from 'lucide-react';
import { Patient } from '@/types/patient';

export interface PatientCardProps {
  /** Patient data to display */
  patient: Patient;
  /** Callback when patient card is clicked */
  onClick: (patient: Patient) => void;
  /** Optional custom className for styling extension (Open/Closed) */
  className?: string;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={() => onClick(patient)}
      className={`group relative p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left overflow-hidden ${className}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all -z-10" />

      {/* Patient Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
            {patient.name}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-400">{patient.age} años</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-sm text-slate-400">{patient.gender}</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
      </div>

      {/* Medical Info */}
      {(patient.allergies?.length || patient.chronicConditions?.length) && (
        <div className="space-y-2">
          {/* Allergies */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">Alergias</p>
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.map((allergy, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chronic Conditions */}
          {patient.chronicConditions && patient.chronicConditions.length > 0 && (
            <div className="flex items-start gap-2">
              <Activity className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">Condiciones crónicas</p>
                <div className="flex flex-wrap gap-1">
                  {patient.chronicConditions.slice(0, 2).map((condition, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-xs text-cyan-300 truncate"
                    >
                      {condition}
                    </span>
                  ))}
                  {patient.chronicConditions.length > 2 && (
                    <span className="inline-block px-2 py-0.5 text-xs text-slate-400">
                      +{patient.chronicConditions.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </button>
  );
};
