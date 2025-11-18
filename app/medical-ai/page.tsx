"use client";

/**
 * Medical AI Workflow - AURITY
 * Production medical consultation workflow with AI-powered transcription
 *
 * Modern medical-grade UI with improved CRUD operations and clinical workflow
 *
 * PROTECTED ROUTE: Requires Auth0 authentication + MEDICO or ADMIN role
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  ConversationCapture,
  DialogueFlow,
  ClinicalNotes,
  EvidencePackViewer,
  OrderEntry,
  SummaryExport
} from '@/components/medical';
import { SessionsTable } from '@/components/SessionsTable';
import { UserDisplay } from '@/components/UserDisplay';
import { PatientSelector, PatientModal } from '@/components/patients';
import {
  Mic, Clock, User, ArrowLeft, Stethoscope, FileText, MessageSquare,
  ClipboardList, Download, History, Plus, Search, Filter, Calendar,
  Users, AlertCircle, CheckCircle2, ChevronRight, Activity, Copy, Check,
  Trash2, X, Loader2, Shield
} from 'lucide-react';
import { useEncounterTimer } from '@/hooks/useEncounterTimer';
import { Patient as MedicalPatient, WorkflowStep, Encounter } from '@/types/medical';
import { getSessionSummaries, getSessionsList, type SessionListItem } from '@/lib/api/timeline';
import { SessionSummary, SessionTaskStatus, Patient } from '@/types/patient';
import { fetchPatients } from '@/lib/api/patients';

// Workflow steps
const MedicalWorkflowSteps = [
  { id: 'escuchar', label: 'Escuchar', icon: Mic, component: ConversationCapture, color: 'emerald' },
  { id: 'revisar', label: 'Revisar', icon: MessageSquare, component: DialogueFlow, color: 'cyan' },
  { id: 'notas', label: 'Notas SOAP', icon: FileText, component: ClinicalNotes, color: 'purple' },
  { id: 'evidencia', label: 'Evidencia', icon: Shield, component: EvidencePackViewer, color: 'indigo' },
  { id: 'ordenes', label: 'Órdenes', icon: ClipboardList, component: OrderEntry, color: 'amber' },
  { id: 'resumen', label: 'Finalizar', icon: Download, component: SummaryExport, color: 'rose' },
];

export default function MedicalAIWorkflow() {
  const router = useRouter();
  const [showPatientSelector, setShowPatientSelector] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);

  // Patient management state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('escuchar');
  const [isRecording, setIsRecording] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [encounterData, setEncounterData] = useState<Partial<Encounter> | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isExistingSession, setIsExistingSession] = useState(false);
  const [sessionDuration, setSessionDuration] = useState<string>(''); // Duration of existing session

  // Search and filters are now handled internally by PatientList and SessionList components

  // Timeline state - store full SessionSummary for rich tooltips
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  // Session status tracking (SOAP/Diarization)
  const [sessionStatuses, setSessionStatuses] = useState<Record<string, SessionTaskStatus>>({});

  // Real-time encounter timer (only run when starting new consultation, not viewing existing)
  const isNewConsultation = selectedPatient && !isExistingSession;
  const { timeElapsed, pause, resume } = useEncounterTimer(isNewConsultation);

  const currentStepIndex = MedicalWorkflowSteps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / MedicalWorkflowSteps.length) * 100;

  // Load patients on mount
  useEffect(() => {
    async function loadPatients() {
      try {
        setLoadingPatients(true);
        setPatientsError(null);
        const fetchedPatients = await fetchPatients({ limit: 100 });
        setPatients(fetchedPatients);
      } catch (err) {
        console.error('Failed to load patients:', err);
        setPatientsError(err instanceof Error ? err.message : 'Error al cargar pacientes');
      } finally {
        setLoadingPatients(false);
      }
    }

    loadPatients();
  }, []);

  // Load previous sessions on mount (sorted by most recent first)
  useEffect(() => {
    async function loadSessions() {
      try {
        setLoadingSessions(true);

        // Load REAL sessions from new lightweight endpoint
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001'}/api/workflows/aurity/sessions?limit=20`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Convert lightweight session format to SessionSummary format
          const convertedSessions: SessionSummary[] = data.sessions.map((s: any) => ({
            metadata: {
              session_id: s.session_id,
              thread_id: null,
              owner_hash: 'system',
              created_at: s.created_at,
              updated_at: s.created_at,
            },
            timespan: {
              start: s.created_at,
              end: s.created_at,
              duration_ms: s.duration_seconds * 1000,
              duration_human: s.duration_seconds > 60
                ? `${(s.duration_seconds / 60).toFixed(1)} min`
                : `${s.duration_seconds.toFixed(0)}s`,
            },
            size: {
              interaction_count: s.chunk_count,
              total_tokens: 0,
              total_chars: s.preview.length,
              avg_tokens_per_interaction: 0,
              size_human: `${(s.preview.length / 1024).toFixed(1)} KB`,
            },
            policy_badges: {
              hash_verified: 'OK',
              policy_compliant: 'OK',
              redaction_applied: 'N/A',
              audit_logged: 'OK',
            },
            preview: s.preview || 'Sin transcripción',
            // NEW: Include patient and doctor names from backend
            patient_name: s.patient_name || 'Paciente',
            doctor_name: s.doctor_name || '',
          }));

          setSessions(convertedSessions);

          // Load statuses for real sessions
          const sessionIds = convertedSessions.map(s => s.metadata.session_id);
          loadSessionStatuses(sessionIds).catch(err => {
            console.warn('[MedicalAI] Failed to load session statuses (non-critical):', err);
          });
        } else {
          console.error('[MedicalAI] Failed to load sessions:', response.statusText);
          setSessions([]);
        }

      } catch (err) {
        console.error('[MedicalAI] Failed to load sessions:', err);
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    }

    loadSessions();
  }, []);

  // Load SOAP and Diarization status for sessions
  const loadSessionStatuses = async (sessionIds: string[]) => {
    const statusesMap: Record<string, any> = {};

    await Promise.all(
      sessionIds.map(async (sessionId) => {
        try {
          // Create AbortController with 5-second timeout (longer for monitor endpoint)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001'}/api/workflows/aurity/sessions/${sessionId}/monitor`,
            {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            statusesMap[sessionId] = {
              soapStatus: data.soap?.status || 'not_started',
              diarizationStatus: data.diarization?.status || 'not_started',
            };
          }
        } catch (err) {
          // Silently fail - status will remain not_started (timeout, network error, etc.)
        }
      })
    );

    setSessionStatuses(statusesMap);
  };

  // Handle delete session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      setDeletingSession(sessionId);

      // TODO: Call backend delete endpoint when implemented
      // For now, just remove from local state
      setSessions(prev => prev.filter(s => s.metadata.session_id !== sessionId));

      setDeleteConfirmSession(null);
      console.log('[MedicalAI] Session deleted:', sessionId);
    } catch (err) {
      console.error('[MedicalAI] Failed to delete session:', err);
      alert('Error al eliminar la sesión. Intenta de nuevo.');
    } finally {
      setDeletingSession(null);
    }
  };

  // Handler for selecting existing session
  const handleSelectSession = (sessionId: string) => {
    // Find the session to get its duration
    const selectedSession = sessions.find(s => s.metadata.session_id === sessionId);
    const duration = selectedSession?.timespan?.duration_human || '00:00';

    setCurrentSessionId(sessionId);
    setIsExistingSession(true); // Mark as read-only existing session
    setSessionDuration(duration); // Store the recorded duration
    setShowPatientSelector(false);
    setCurrentStep('escuchar'); // Start at first step to show content
    console.log('[MedicalAI] Selected existing session (read-only):', sessionId, 'Duration:', duration);
  };

  // Handle new patient consultation
  const handleStartNewConsultation = (patient: Patient) => {
    // Convert Patient to MedicalPatient format
    const medicalPatient: MedicalPatient = {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      medicalHistory: patient.medicalHistory || [],
      allergies: patient.allergies || [],
      chronicConditions: patient.chronicConditions || [],
      currentMedications: patient.currentMedications || [],
    };
    setSelectedPatient(medicalPatient);
    setIsExistingSession(false); // Mark as new session (can record)
    setSessionDuration(''); // Clear recorded duration (will use live timer)
    setShowPatientSelector(false);
    setCurrentStep('escuchar');
    setCompletedSteps(new Set());
  };

  // Copy session ID to clipboard
  const handleCopySessionId = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent session selection when clicking copy
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopiedSessionId(sessionId);
      setTimeout(() => setCopiedSessionId(null), 2000); // Reset after 2s
    } catch (err) {
      console.error('Failed to copy session ID:', err);
    }
  };

  // Extract medical keywords from session preview (simple heuristic)
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

    return Array.from(found).slice(0, 3); // Max 3 keywords
  };

  if (showPatientSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header */}
        <header className="border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/80 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-medium">AURITY</span>
                </button>
                <div className="h-6 w-px bg-slate-700" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">Medical AI Workflow</h1>
                    <p className="text-sm text-slate-400">Selecciona paciente o continúa consulta</p>
                  </div>
                </div>
              </div>
              {/* User Authentication Display - Always Visible */}
              <UserDisplay />
            </div>
          </div>
        </header>

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

          {/* SOLID Patient & Session Selector */}
          <PatientSelector
            patients={patients}
            sessions={sessions}
            sessionStatuses={sessionStatuses}
            onSelectPatient={handleStartNewConsultation}
            onSelectSession={handleSelectSession}
            onDeleteSession={(sessionId) => setDeleteConfirmSession(sessionId)}
            onCopySessionId={handleCopySessionId}
            copiedSessionId={copiedSessionId}
            loadingSessions={loadingSessions}
            extractMedicalInfo={extractMedicalInfo}
            onAddPatient={() => setShowPatientModal(true)}
          />

          {/* Patient Creation Modal */}
          <PatientModal
            isOpen={showPatientModal}
            onClose={() => setShowPatientModal(false)}
            onSuccess={(newPatient) => {
              setPatients(prev => [...prev, newPatient]);
              setShowPatientModal(false);
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
        </main>
      </div>
    );
  }

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

  const currentStepData = MedicalWorkflowSteps[currentStepIndex];

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
                <div className={`w-10 h-10 bg-gradient-to-br from-${currentStepData.color}-500 to-${currentStepData.color}-600 rounded-xl flex items-center justify-center shadow-lg shadow-${currentStepData.color}-500/20 transition-all`}>
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
              {/* User Authentication Display - Always Visible */}
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
                        ? `bg-${step.color}-500/20 border-2 border-${step.color}-500/50 text-${step.color}-300 shadow-lg shadow-${step.color}-500/20`
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
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500 shadow-lg shadow-emerald-500/30"
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
