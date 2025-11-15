"use client";

/**
 * Medical AI Workflow - AURITY
 * Production medical consultation workflow with AI-powered transcription
 *
 * This page provides a complete medical workflow with AI-powered transcription
 * and clinical note generation integrated with FI backend services.
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
import { Mic, MicOff, Clock, User, ArrowLeft, Stethoscope, FileText, MessageSquare, ClipboardList, Download } from 'lucide-react';

// Workflow steps
const MedicalWorkflowSteps = [
  { id: 'escuchar', label: 'Escuchar', icon: Mic, component: ConversationCapture },
  { id: 'revisar', label: 'Revisar', icon: MessageSquare, component: DialogueFlow },
  { id: 'notas', label: 'Notas', icon: FileText, component: ClinicalNotes },
  { id: 'ordenes', label: 'Órdenes', icon: ClipboardList, component: OrderEntry },
  { id: 'resumen', label: 'Resumen', icon: Download, component: SummaryExport },
];

// Patient data (would be fetched from FI backend in production)
const patients = [
  {
    id: '1',
    name: 'María García',
    age: 45,
    gender: 'Femenino',
    medicalHistory: ['Hipertensión', 'Diabetes Tipo 2']
  },
  {
    id: '2',
    name: 'Juan Pérez',
    age: 62,
    gender: 'Masculino',
    medicalHistory: ['Asma', 'Artritis']
  },
  {
    id: '3',
    name: 'Ana Martínez',
    age: 33,
    gender: 'Femenino',
    medicalHistory: []
  }
];

export default function MedicalAIWorkflow() {
  const router = useRouter();
  const [showPatientSelector, setShowPatientSelector] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState('escuchar');
  const [isRecording, setIsRecording] = useState(false);
  const [encounterTime] = useState('00:08:23');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentStepIndex = MedicalWorkflowSteps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / MedicalWorkflowSteps.length) * 100;

  if (showPatientSelector) {
    return (
      <div className="min-h-screen bg-slate-900">
        <header className="border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver a AURITY
            </button>
          </div>
        </header>

        <main className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center shadow-inner backdrop-blur-sm">
                  <User className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Seleccionar Paciente
                  </h2>
                  <p className="text-sm text-slate-400">
                    Elige un paciente para comenzar la consulta
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setShowPatientSelector(false);
                    }}
                    className="w-full text-left p-4 border border-slate-700 bg-slate-900/50 rounded-lg hover:border-emerald-500 hover:bg-emerald-500/10 transition-smooth hover-scale"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{patient.name}</div>
                        <div className="text-sm text-slate-400">{patient.age} años</div>
                      </div>
                      <div className="text-sm text-slate-500">{patient.gender}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const CurrentComponent = MedicalWorkflowSteps[currentStepIndex].component;

  const goToNextStep = () => {
    if (currentStepIndex < MedicalWorkflowSteps.length - 1) {
      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      // Move to next step
      setCurrentStep(MedicalWorkflowSteps[currentStepIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(MedicalWorkflowSteps[currentStepIndex - 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Workflow Médico con IA</h1>
                <p className="text-sm text-slate-400">Asistente de consulta médica</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="badge-modern border border-emerald-500/20 bg-emerald-500/10">
              <User className="h-4 w-4 text-emerald-400" />
              <span className="font-medium text-white">
                {selectedPatient ? `${selectedPatient.name}, ${selectedPatient.age} años` : ''}
              </span>
            </div>
            <div className="badge-modern border border-cyan-500/20 bg-cyan-500/10">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="font-medium text-white">{encounterTime}</span>
            </div>
            <button
              onClick={() => {
                setSelectedPatient(null);
                setShowPatientSelector(true);
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cambiar Paciente
            </button>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-400">Flujo de Consulta</h2>
            <div className="text-sm text-slate-500">
              Paso {currentStepIndex + 1} de {MedicalWorkflowSteps.length}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            {MedicalWorkflowSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = completedSteps.has(step.id);
              const isPreviousCompleted = index === 0 || completedSteps.has(MedicalWorkflowSteps[index - 1].id);
              const isUnlocked = isActive || isCompleted || (isPreviousCompleted && index <= currentStepIndex + 1);

              return (
                <div key={step.id} className="flex items-center gap-2">
                  <button
                    onClick={() => isUnlocked && setCurrentStep(step.id)}
                    disabled={!isUnlocked}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : isCompleted
                        ? 'text-green-400 hover:bg-green-900/50'
                        : isUnlocked
                        ? 'text-slate-400 hover:bg-slate-800 border border-slate-700'
                        : 'text-slate-600 bg-slate-800/50 border border-slate-800 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{step.label}</span>
                  </button>
                  {index < MedicalWorkflowSteps.length - 1 && (
                    <div className={`w-8 h-0.5 ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-slate-900">
        <div className="p-8">
          <CurrentComponent
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
          />
        </div>
      </main>
    </div>
  );
}
