"use client";

/**
 * Medical AI Workflow - AURITY
 * Production medical consultation workflow with AI-powered transcription
 *
 * Modern medical-grade UI with improved CRUD operations and clinical workflow
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ConversationCapture,
  DialogueFlow,
  ClinicalNotes,
  OrderEntry,
  SummaryExport
} from '@/components/medical';
import { SessionsTable } from '@/components/SessionsTable';
import {
  Mic, Clock, User, ArrowLeft, Stethoscope, FileText, MessageSquare,
  ClipboardList, Download, History, Plus, Search, Filter, Calendar,
  Users, AlertCircle, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';
import { useEncounterTimer } from '@/hooks/useEncounterTimer';
import { Patient, WorkflowStep, Encounter } from '@/types/medical';
import { getSessionSummaries, type SessionSummary } from '@/lib/api/timeline';

// Workflow steps
const MedicalWorkflowSteps = [
  { id: 'escuchar', label: 'Escuchar', icon: Mic, component: ConversationCapture, color: 'emerald' },
  { id: 'revisar', label: 'Revisar', icon: MessageSquare, component: DialogueFlow, color: 'cyan' },
  { id: 'notas', label: 'Notas SOAP', icon: FileText, component: ClinicalNotes, color: 'purple' },
  { id: 'ordenes', label: 'Órdenes', icon: ClipboardList, component: OrderEntry, color: 'amber' },
  { id: 'resumen', label: 'Finalizar', icon: Download, component: SummaryExport, color: 'rose' },
];

// Patient data (TODO: Fetch from FI backend API in production)
const patients: Patient[] = [
  {
    id: '1',
    name: 'María García López',
    age: 45,
    gender: 'Femenino',
    medicalHistory: ['Hipertensión', 'Diabetes Tipo 2'],
    allergies: ['Penicilina'],
    chronicConditions: ['Hipertensión', 'Diabetes Tipo 2']
  },
  {
    id: '2',
    name: 'Juan Pérez Rodríguez',
    age: 62,
    gender: 'Masculino',
    medicalHistory: ['Asma', 'Artritis'],
    chronicConditions: ['Asma', 'Artritis'],
    currentMedications: ['Salbutamol', 'Ibuprofeno']
  },
  {
    id: '3',
    name: 'Ana Martínez Sánchez',
    age: 33,
    gender: 'Femenino',
    medicalHistory: [],
    allergies: []
  },
  {
    id: '4',
    name: 'Carlos Hernández Mora',
    age: 28,
    gender: 'Masculino',
    medicalHistory: ['Migraña'],
    chronicConditions: ['Migraña']
  },
];

export default function MedicalAIWorkflow() {
  const router = useRouter();
  const [showPatientSelector, setShowPatientSelector] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('escuchar');
  const [isRecording, setIsRecording] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [encounterData, setEncounterData] = useState<Partial<Encounter> | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // Search and filters
  const [patientSearch, setPatientSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'today' | 'week'>('all');

  // Timeline state - store full SessionSummary for rich tooltips
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Real-time encounter timer
  const { timeElapsed, pause, resume } = useEncounterTimer(true);

  const currentStepIndex = MedicalWorkflowSteps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / MedicalWorkflowSteps.length) * 100;

  // Load previous sessions on mount (sorted by most recent first)
  useEffect(() => {
    async function loadSessions() {
      try {
        setLoadingSessions(true);
        const summaries = await getSessionSummaries({ limit: 20, sort: 'recent' });
        setSessions(summaries); // Store full SessionSummary objects
      } catch (err) {
        console.error('[MedicalAI] Failed to load sessions:', err);
      } finally {
        setLoadingSessions(false);
      }
    }

    loadSessions();
  }, []);

  // Filter patients by search
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // Handler for selecting existing session
  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowPatientSelector(false);
    console.log('[MedicalAI] Selected existing session:', sessionId);
  };

  // Handle new patient consultation
  const handleStartNewConsultation = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSelector(false);
    setCurrentStep('escuchar');
    setCompletedSteps(new Set());
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
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: Patient Selector - 2/3 width */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search Bar */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                    <Plus className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">Nueva Consulta</h2>
                    <p className="text-sm text-slate-400">Busca y selecciona un paciente</p>
                  </div>
                  <div className="badge-modern bg-emerald-500/10 border-emerald-500/20">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">{filteredPatients.length} pacientes</span>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre del paciente..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Patient Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredPatients.length === 0 ? (
                    <div className="col-span-2 py-12 text-center">
                      <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No se encontraron pacientes</p>
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handleStartNewConsultation(patient)}
                        className="group relative p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left overflow-hidden"
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
                        {(patient.allergies?.length > 0 || patient.chronicConditions?.length > 0) && (
                          <div className="space-y-2">
                            {patient.allergies && patient.allergies.length > 0 && (
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-500 mb-1">Alergias</p>
                                  <div className="flex flex-wrap gap-1">
                                    {patient.allergies.map((allergy, idx) => (
                                      <span key={idx} className="inline-block px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300">
                                        {allergy}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                              <div className="flex items-start gap-2">
                                <Activity className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-500 mb-1">Condiciones crónicas</p>
                                  <div className="flex flex-wrap gap-1">
                                    {patient.chronicConditions.slice(0, 2).map((condition, idx) => (
                                      <span key={idx} className="inline-block px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-xs text-cyan-300 truncate">
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
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Sessions Timeline - 1/3 width */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 shadow-xl sticky top-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                    <History className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">Consultas Anteriores</h2>
                    <p className="text-sm text-slate-400">Continúa una sesión</p>
                  </div>
                </div>

                {/* Session Filters */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSessionFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sessionFilter === 'all'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setSessionFilter('today')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sessionFilter === 'today'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setSessionFilter('week')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sessionFilter === 'week'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    Semana
                  </button>
                </div>

                {loadingSessions ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full mb-3" />
                    <span className="text-sm text-slate-400">Cargando sesiones...</span>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="py-12 text-center">
                    <History className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No hay consultas previas</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {sessions.slice(0, 10).map((session) => {
                      const date = new Date(session.metadata.created_at);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const duration = session.timespan?.duration_human || 'N/A';
                      const chunkCount = session.size?.interaction_count || 0;
                      const totalChars = session.size?.total_chars || 0;
                      const preview = session.preview || 'Sin transcripción';

                      return (
                        <div key={session.metadata.session_id} className="relative group/session">
                          <button
                            onClick={() => handleSelectSession(session.metadata.session_id)}
                            className="w-full p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-white group-hover/session:text-cyan-300 transition-colors">
                                  {date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                                </span>
                                {isToday && (
                                  <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300">
                                    Hoy
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">
                                {date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-400 font-mono">{session.metadata.session_id.slice(0, 12)}...</span>
                              <span className="text-xs text-cyan-400 font-semibold">{duration}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-300">
                                <CheckCircle2 className="h-3 w-3" />
                                {chunkCount} chunks
                              </span>
                            </div>
                          </button>

                          {/* Tooltip - appears on hover */}
                          <div className="absolute left-full ml-2 top-0 w-72 p-4 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover/session:opacity-100 group-hover/session:visible transition-all duration-200 z-50 pointer-events-none">
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="h-4 w-4 text-cyan-400" />
                                  <span className="text-xs font-semibold text-cyan-300">Duración</span>
                                </div>
                                <p className="text-sm text-white font-mono">{duration}</p>
                              </div>

                              <div className="h-px bg-slate-700" />

                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Activity className="h-4 w-4 text-purple-400" />
                                  <span className="text-xs font-semibold text-purple-300">Métricas</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Chunks:</span>
                                    <span className="text-white font-mono">{chunkCount}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Caracteres:</span>
                                    <span className="text-white font-mono">{totalChars.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="h-px bg-slate-700" />

                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="h-4 w-4 text-amber-400" />
                                  <span className="text-xs font-semibold text-amber-300">Preview</span>
                                </div>
                                <p className="text-xs text-slate-300 line-clamp-3 italic">
                                  "{preview.slice(0, 150)}{preview.length > 150 ? '...' : ''}"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
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
                <span className="font-medium text-white font-mono">{timeElapsed}</span>
              </div>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setShowPatientSelector(true);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700 hover:border-slate-600"
              >
                Cambiar Paciente
              </button>
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
                />
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
