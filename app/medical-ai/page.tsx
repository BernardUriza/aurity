"use client";

/**
 * Medical AI Workflow - AURITY (REFACTORED)
 *
 * Production medical consultation workflow with AI-powered transcription
 * PROTECTED ROUTE: Requires Auth0 authentication + MEDICO or ADMIN role
 *
 * REFACTORED: Modular architecture with custom hooks
 * - usePatientManagement: Patient state
 * - useSessionManagement: Session state
 * - WorkflowSteps: Workflow configuration
 */

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserDisplay } from '@/components/auth/UserDisplay';
import { medicalAiHeader } from '@/config/page-headers';
import { PatientSelector, PatientModal } from '@/components/patients';
import { SessionAuditPanel } from '@/components/medical';
import {
  Mic, Clock, User, ArrowLeft, Stethoscope, FileText, MessageSquare,
  ClipboardList, Download, History, Plus, Search, Filter, Calendar,
  Users, AlertCircle, CheckCircle2, ChevronRight, Activity, Copy, Check,
  Trash2, X, Loader2, Shield
} from 'lucide-react';
import { useEncounterTimer } from '@/hooks/useEncounterTimer';
import { WorkflowStep, Encounter } from '@/types/medical';

// Modular imports
import { MedicalWorkflowSteps } from './WorkflowSteps';
import { usePatientManagement } from './usePatientManagement';
import { useSessionManagement } from './useSessionManagement';

export default function MedicalAIWorkflow() {
  const router = useRouter();

  // Patient management (custom hook)
  const {
    patients,
    loadingPatients,
    patientsError,
    showPatientModal,
    setShowPatientModal,
    editingPatient,
    setEditingPatient,
    selectedPatient,
    setSelectedPatient,
    handleStartNewConsultation,
    handleEditPatient,
  } = usePatientManagement();

  // Session management (custom hook)
  const {
    sessions,
    loadingSessions,
    currentSessionId,
    setCurrentSessionId,
    isExistingSession,
    setIsExistingSession,
    sessionDuration,
    setSessionDuration,
    copiedSessionId,
    setCopiedSessionId,
    deleteConfirmSession,
    setDeleteConfirmSession,
    deletingSession,
    sessionStatuses,
    handleDeleteSession,
    handleSelectSession,
    handleCopySessionId,
  } = useSessionManagement();

  // UI state
  const [showPatientSelector, setShowPatientSelector] = useState(true);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('escuchar');
  const [isRecording, setIsRecording] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [encounterData, setEncounterData] = useState<Partial<Encounter> | null>(null);

  // Audit panel state (NEW)
  const [auditSessionId, setAuditSessionId] = useState<string | null>(null);

  // Real-time encounter timer (only for new consultations)
  const isNewConsultation = selectedPatient && !isExistingSession;
  const { timeElapsed, pause, resume } = useEncounterTimer(isNewConsultation);

  const currentStepIndex = MedicalWorkflowSteps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / MedicalWorkflowSteps.length) * 100;

  // Extract medical keywords from session preview
  const extractMedicalInfo = (preview: string): string[] => {
    const medicalKeywords = [
      'hipertensión', 'diabetes', 'asma', 'artritis', 'migraña',
      'alergia', 'penicilina', 'dolor', 'fiebre', 'tos',
      'gripe', 'covid', 'presión', 'glucosa', 'colesterol'
    ];

    const found = new Set<string>();
    const lowerPreview = preview.toLowerCase();

    medicalKeywords.forEach(keyword => {
      if (lowerPreview.includes(keyword)) {
        found.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    return Array.from(found).slice(0, 3);
  };

  // Calculate session counts per patient
  const sessionCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    sessions.forEach(session => {
      const patientName = session.patient_name;
      if (patientName && patientName !== 'Paciente') {
        const matchingPatient = patients.find(p => p.name === patientName);
        if (matchingPatient) {
          counts[matchingPatient.id] = (counts[matchingPatient.id] || 0) + 1;
        }
      }
    });

    return counts;
  }, [sessions, patients]);

  // Workflow navigation
  const goToNextStep = () => {
    if (currentStepIndex < MedicalWorkflowSteps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(MedicalWorkflowSteps[currentStepIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(MedicalWorkflowSteps[currentStepIndex - 1].id);
    }
  };

  // Handle patient selection and session start
  const handlePatientSelected = (patient: any) => {
    handleStartNewConsultation(patient);
    setIsExistingSession(false);
    setSessionDuration('');
    setShowPatientSelector(false);
    setCurrentStep('escuchar');
    setCompletedSteps(new Set());
  };

  // Handle existing session selection
  const handleExistingSessionSelected = (sessionId: string) => {
    handleSelectSession(sessionId);
    setShowPatientSelector(false);
    setCurrentStep('escuchar');
  };

  const headerConfig = medicalAiHeader({});
  const currentStepData = MedicalWorkflowSteps[currentStepIndex];

  // Patient Selector View
  if (showPatientSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <PageHeader {...headerConfig} />

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Error Loading Patients */}
          {patientsError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">Error al cargar pacientes</p>
                <p className="text-sm text-red-400 mt-1">{patientsError}</p>
              </div>
            </div>
          )}

          {/* Patient & Session Selector */}
          <PatientSelector
            patients={patients}
            sessions={sessions}
            sessionStatuses={sessionStatuses}
            sessionCounts={sessionCounts}
            onSelectPatient={handlePatientSelected}
            onEditPatient={handleEditPatient}
            onSelectSession={handleExistingSessionSelected}
            onDeleteSession={(sessionId) => setDeleteConfirmSession(sessionId)}
            onCopySessionId={handleCopySessionId}
            onAuditSession={(sessionId) => setAuditSessionId(sessionId)} // NEW
            copiedSessionId={copiedSessionId}
            loadingSessions={loadingSessions}
            extractMedicalInfo={extractMedicalInfo}
            onAddPatient={() => setShowPatientModal(true)}
          />

          {/* Patient Creation/Edit Modal */}
          <PatientModal
            isOpen={showPatientModal || editingPatient !== null}
            mode={editingPatient ? 'edit' : 'create'}
            patient={editingPatient || undefined}
            initialData={editingPatient ? {
              nombre: editingPatient.name.split(' ')[0],
              apellido: editingPatient.name.split(' ').slice(1).join(' '),
              fecha_nacimiento: editingPatient.fechaNacimiento,
              curp: editingPatient.curp || null,
            } : undefined}
            onClose={() => {
              setShowPatientModal(false);
              setEditingPatient(null);
            }}
            onSuccess={(patient) => {
              // Handled by usePatientManagement internally
              setShowPatientModal(false);
              setEditingPatient(null);
            }}
          />

          {/* Delete Confirmation Modal */}
          {deleteConfirmSession && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trash2 className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Eliminar Sesión</h3>
                    <p className="text-sm text-slate-400">
                      ¿Estás seguro de eliminar esta sesión? Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 mb-6">
                  <div className="text-xs text-slate-500 mb-1">Session ID</div>
                  <div className="text-sm font-mono text-white">{deleteConfirmSession}</div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmSession(null)}
                    disabled={deletingSession !== null}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteSession(deleteConfirmSession)}
                    disabled={deletingSession !== null}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingSession === deleteConfirmSession ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Session Audit Panel (NEW) */}
          {auditSessionId && (
            <SessionAuditPanel
              sessionId={auditSessionId}
              isOpen={true}
              onClose={() => setAuditSessionId(null)}
              onApprove={() => {
                console.log('[MedicalAI] Session approved:', auditSessionId);
                // Refresh sessions list
              }}
              onReject={() => {
                console.log('[MedicalAI] Session rejected:', auditSessionId);
                // Refresh sessions list
              }}
            />
          )}
        </main>
      </div>
    );
  }

  // Workflow View (Patient selected, working on consultation)
  return (
    <ProtectedRoute requireRoles={['MEDICO', 'ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Modern Header */}
        <header className="border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/80 sticky top-0 z-50">
          <div className="px-6 py-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br from-${currentStepData.color}-500 to-${currentStepData.color}-600 rounded-xl flex items-center justify-center shadow-lg`}>
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">Medical AI Workflow</h1>
                    <p className="text-sm text-slate-400">Consulta médica con IA</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="badge-modern bg-emerald-500/10 border-emerald-500/20">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium text-white">
                    {selectedPatient ? `${selectedPatient.name}, ${selectedPatient.age} años` : 'Paciente'}
                  </span>
                </div>
                <div className="badge-modern bg-cyan-500/10 border-cyan-500/20">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span className="font-medium text-white font-mono">
                    {isExistingSession && sessionDuration ? sessionDuration : timeElapsed}
                  </span>
                </div>
                {currentSessionId && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentSessionId);
                      setCopiedSessionId(currentSessionId);
                      setTimeout(() => setCopiedSessionId(null), 2000);
                    }}
                    className="badge-modern bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 transition-all cursor-pointer group"
                    title="Copiar Session ID"
                  >
                    <Activity className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-white font-mono text-xs max-w-[120px] truncate">
                      {currentSessionId.split('-')[0]}...
                    </span>
                    {copiedSessionId === currentSessionId ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-purple-400 opacity-50 group-hover:opacity-100" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setShowPatientSelector(true);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700 hover:border-slate-600"
                >
                  Cambiar Paciente
                </button>
                <UserDisplay />
              </div>
            </div>

            {/* Workflow Steps - Modern Pills */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {MedicalWorkflowSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = completedSteps.has(step.id);

                return (
                  <React.Fragment key={step.id}>
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                        isActive
                          ? `bg-${step.color}-500/20 border-2 border-${step.color}-500/50 text-${step.color}-300 shadow-lg`
                          : isCompleted
                          ? 'bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20'
                          : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span className="text-sm font-semibold">{step.label}</span>
                      {isActive && (
                        <span className={`ml-1 px-2 py-0.5 bg-${step.color}-500/30 rounded text-xs font-bold`}>
                          {index + 1}/{MedicalWorkflowSteps.length}
                        </span>
                      )}
                    </button>
                    {index < MedicalWorkflowSteps.length - 1 && (
                      <ChevronRight className={`h-4 w-4 ${isCompleted ? 'text-green-500' : 'text-slate-700'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-400">Progreso de consulta</span>
                <span className="text-xs font-bold text-emerald-400">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {MedicalWorkflowSteps.map((step) => {
              const StepComponent = step.component;
              const isActive = step.id === currentStep;
              const isCapture = step.id === 'escuchar';

              if (!isCapture && !isActive && !completedSteps.has(step.id)) {
                return null;
              }

              return (
                <div
                  key={step.id}
                  style={{ display: isActive ? 'block' : 'none' }}
                  className="animate-fade-in"
                >
                  <StepComponent
                    onNext={goToNextStep}
                    onPrevious={goToPreviousStep}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    encounterData={encounterData || undefined}
                    patient={selectedPatient || undefined}
                    sessionId={currentSessionId}
                    onSessionCreated={setCurrentSessionId}
                    readOnly={isExistingSession}
                  />
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
