"use client";

/**
 * Onboarding Flow Component - Free Intelligence Integration
 *
 * Card: FI-ONBOARD-003
 * Phases: Welcome (Meet FI) → Survey (Personalization) → [Future phases]
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AurityBanner } from "../layout/AurityBanner";
import { FIMessageBubble } from "./FIMessageBubble";
import { FIChatInput } from "./FIChatInput";
import { FITypingIndicator } from "./FITypingIndicator";
import { PatientSetupForm, PatientFormData } from "./PatientSetupForm";
import { HDF5Preview } from "./HDF5Preview";
import { FlowDiagram } from "./FlowDiagram";
import { ConsultationSimulation } from "./ConsultationSimulation";
import { ExportReport } from "./ExportReport";
import { CompletionCelebration } from "./CompletionCelebration";
import { OnboardingEvidence } from "@/lib/export-evidence";
import { useFIConversation } from "@/hooks/useFIConversation";
import type { UserRole, ClinicType, AIExperience } from "@/types/assistant";

type Phase = "welcome" | "survey" | "glitch" | "beta" | "residencia" | "patient_setup" | "consultation" | "export" | "complete";

const STORAGE_KEY = "fi_onboarding_progress";

interface SurveyData {
  userRole?: UserRole;
  clinicType?: ClinicType;
  consultasPerDay?: '1-5' | '6-15' | '16-30' | '31+';
  aiExperience?: AIExperience;
}

interface OnboardingState {
  phase: Phase;
  survey: SurveyData;
}

/**
 * Main onboarding flow with Free-Intelligence integration
 */
export function OnboardingFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("welcome");
  const [surveyData, setSurveyData] = useState<SurveyData>({});
  const [patientData, setPatientData] = useState<PatientFormData>({
    nombre: '',
    edad: '',
    genero: '',
    motivoConsulta: '',
  });
  const [showSkipModal, setShowSkipModal] = useState(false);

  // Quiz states (for Phase "glitch" and "beta")
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Reset quiz state when phase changes
  useEffect(() => {
    setQuizAnswer(null);
    setShowFeedback(false);
  }, [phase]);

  // FI Conversation hook for Phase 0 (Welcome)
  const {
    messages,
    loading: fiLoading,
    isTyping,
    getIntroduction,
  } = useFIConversation({
    phase: 'welcome',
    storageKey: 'fi_onboarding_conversation',
    autoIntroduction: phase === 'welcome',
  });

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: OnboardingState = JSON.parse(saved);
        setPhase(state.phase);
        setSurveyData(state.survey || {});
      }
    } catch (error) {
      console.error("Failed to load onboarding progress:", error);
    }
  }, []);

  // Save progress to localStorage whenever state changes
  useEffect(() => {
    try {
      const state: OnboardingState = {
        phase,
        survey: surveyData,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save onboarding progress:", error);
    }
  }, [phase, surveyData]);

  /**
   * Handle survey selection
   */
  const handleSurveySelect = (field: keyof SurveyData, value: string) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Complete survey and move to next phase
   */
  const completeSurvey = () => {
    // Save survey data
    localStorage.setItem('fi_onboarding_survey', JSON.stringify(surveyData));

    // Move to philosophy phases
    setPhase('glitch');
  };

  /**
   * Handle skip onboarding
   */
  const handleSkipConfirm = () => {
    // Mark onboarding as completed (but skipped)
    localStorage.setItem('aurity_onboarding_completed', 'true');
    localStorage.setItem('aurity_onboarding_skipped', 'true');

    // Close modal and go to dashboard
    setShowSkipModal(false);
    router.push('/');
  };

  /**
   * Render current phase
   */
  const renderPhase = () => {
    switch (phase) {
      // ============================================================
      // PHASE 0: WELCOME - Meet Free-Intelligence
      // ============================================================
      case "welcome":
        return (
          <div className="space-y-6">
            {/* Page Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-50 mb-2">
                Bienvenido a AURITY
              </h1>
              <p className="text-slate-400">
                Conoce a Free-Intelligence, tu asistente residente
              </p>
            </div>

            {/* FI Conversation */}
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Display FI introduction message */}
              {messages.map((msg, idx) => (
                <FIMessageBubble
                  key={idx}
                  message={msg}
                  showTimestamp={false}
                  animate
                />
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <FITypingIndicator
                  show
                  persona="onboarding_guide"
                />
              )}
            </div>

            {/* CTA: Proceed to survey */}
            {messages.length > 0 && !fiLoading && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setPhase('survey')}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg hover:scale-105"
                >
                  Continuar con la personalización →
                </button>
              </div>
            )}
          </div>
        );

      // ============================================================
      // PHASE 1: SURVEY - Personalization
      // ============================================================
      case "survey":
        const isSurveyComplete = !!(
          surveyData.userRole &&
          surveyData.clinicType &&
          surveyData.consultasPerDay &&
          surveyData.aiExperience
        );

        return (
          <div className="space-y-8 max-w-3xl mx-auto">
            {/* Page Title */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-50 mb-2">
                Personaliza tu experiencia
              </h2>
              <p className="text-slate-400">
                Ayúdanos a conocer tu práctica médica
              </p>
            </div>

            {/* Question 1: Rol */}
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-slate-200">
                ¿Cuál es tu rol?
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'medico_general', label: 'Médico General', icon: '👨‍⚕️', desc: 'Atención primaria' },
                  { value: 'especialista', label: 'Especialista', icon: '🩺', desc: 'Área especializada' },
                  { value: 'enfermera', label: 'Enfermera/o', icon: '💉', desc: 'Cuidado directo' },
                  { value: 'administrador', label: 'Administrador', icon: '📋', desc: 'Gestión clínica' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSurveySelect('userRole', option.value)}
                    className={`
                      p-4 rounded-xl border-2 transition-all text-left
                      ${surveyData.userRole === option.value
                        ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-500/20'
                        : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-semibold text-slate-200">{option.label}</span>
                    </div>
                    <p className="text-xs text-slate-400">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Tipo de clínica */}
            {surveyData.userRole && (
              <div className="space-y-4 animate-fade-in-up">
                <label className="block text-lg font-semibold text-slate-200">
                  ¿Tipo de clínica?
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'privada', label: 'Privada', icon: '🏥' },
                    { value: 'publica', label: 'Pública', icon: '🏛️' },
                    { value: 'mixta', label: 'Mixta', icon: '🔄' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSurveySelect('clinicType', option.value)}
                      className={`
                        p-4 rounded-xl border-2 transition-all
                        ${surveyData.clinicType === option.value
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600'
                        }
                      `}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-semibold text-slate-200">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question 3: Consultas por día */}
            {surveyData.clinicType && (
              <div className="space-y-4 animate-fade-in-up">
                <label className="block text-lg font-semibold text-slate-200">
                  ¿Cuántas consultas atiendes al día?
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { value: '1-5', label: '1-5', icon: '🔵' },
                    { value: '6-15', label: '6-15', icon: '🟢' },
                    { value: '16-30', label: '16-30', icon: '🟡' },
                    { value: '31+', label: '31+', icon: '🔴' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSurveySelect('consultasPerDay', option.value as SurveyData['consultasPerDay'])}
                      className={`
                        p-4 rounded-xl border-2 transition-all
                        ${surveyData.consultasPerDay === option.value
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600'
                        }
                      `}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-semibold text-slate-200">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question 4: Experiencia con IA */}
            {surveyData.consultasPerDay && (
              <div className="space-y-4 animate-fade-in-up">
                <label className="block text-lg font-semibold text-slate-200">
                  ¿Experiencia previa con IA médica?
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'ninguna', label: 'Ninguna', icon: '🌱', desc: 'Primera vez' },
                    { value: 'basica', label: 'Básica', icon: '🌿', desc: 'He probado algunas herramientas' },
                    { value: 'avanzada', label: 'Avanzada', icon: '🌳', desc: 'Uso frecuente' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSurveySelect('aiExperience', option.value as AIExperience)}
                      className={`
                        p-4 rounded-xl border-2 transition-all
                        ${surveyData.aiExperience === option.value
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600'
                        }
                      `}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-semibold text-slate-200 mb-1">{option.label}</div>
                      <p className="text-xs text-slate-400">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Complete Button */}
            {isSurveyComplete && (
              <div className="text-center mt-12 animate-fade-in-up">
                <button
                  onClick={completeSurvey}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg hover:scale-105"
                >
                  Continuar con filosofía →
                </button>
              </div>
            )}
          </div>
        );

      // ============================================================
      // PHASE 2: GLITCH ELEGANTE (Materia)
      // ============================================================
      case "glitch": {
        const handleQuizAnswer = (answer: string) => {
          setQuizAnswer(answer);
          setShowFeedback(true);
        };

        const quizOptions = [
          { id: 'panic', label: 'Reintentar todo desde cero', desc: 'Borrar y empezar de nuevo' },
          { id: 'ignore', label: 'Ignorar el chunk fallido', desc: 'Generar SOAP con 49/50' },
          { id: 'manual', label: 'Requerir intervención manual', desc: 'Alertar al médico inmediatamente' },
          { id: 'smart', label: 'Aplicar error budget', desc: '99.9% SLO cumplido = ✅' },
        ];

        const feedbackForAnswer: Record<string, { emoji: string; title: string; message: string; correct: boolean }> = {
          panic: {
            emoji: '❌',
            title: 'Reacción instintiva, pero costosa',
            message: 'Reintentar desde cero desperdicia recursos computacionales y tiempo del médico. 49 chunks exitosos representan ~14 minutos de consulta ya procesados.',
            correct: false,
          },
          ignore: {
            emoji: '⚠️',
            title: 'Peligroso para integridad clínica',
            message: 'Ignorar datos faltantes puede resultar en notas SOAP incompletas. La ausencia de contexto puede afectar diagnóstico o tratamiento.',
            correct: false,
          },
          manual: {
            emoji: '🚫',
            title: 'Sobrecarga innecesaria al médico',
            message: 'Interrumpir al médico por un 2% de error (1/50 chunks) contradice el propósito de Free-Intelligence: reducir carga, no aumentarla.',
            correct: false,
          },
          smart: {
            emoji: '✅',
            title: 'Error budget inteligente',
            message: 'Exacto. Con SLO 99.9%, un sistema puede fallar 0.1% del tiempo. 1/50 chunks = 98% success rate ✅. SOAP se genera con contexto suficiente, chunk faltante se marca como gap known.',
            correct: true,
          },
        };

        return (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-red-50 mb-2">
                🔥 Glitch Elegante: La Imperfección es Condición Necesaria
              </h2>
              <p className="text-slate-400">
                Phase 2 of 8 · Hermetic Aphorism: Materia
              </p>
            </div>

            {/* Error Budget Explanation */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-red-700/30">
              <h3 className="text-lg font-semibold text-red-300 mb-4">⚡ SLO 99.9% - Error Budget</h3>
              <p className="text-slate-300 mb-4">
                Free-Intelligence no promete perfección al 100%. Eso sería mentira. En lugar de eso, establece un{' '}
                <span className="text-red-400 font-semibold">contrato explícito</span>: SLO 99.9%.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-green-950/30 rounded-lg border border-green-700/30">
                  <div className="text-2xl font-bold text-green-400">99.9%</div>
                  <div className="text-xs text-slate-400">Success Rate Target</div>
                </div>
                <div className="p-4 bg-yellow-950/30 rounded-lg border border-yellow-700/30">
                  <div className="text-2xl font-bold text-yellow-400">0.1%</div>
                  <div className="text-xs text-slate-400">Error Budget (OK fallar)</div>
                </div>
                <div className="p-4 bg-blue-950/30 rounded-lg border border-blue-700/30">
                  <div className="text-2xl font-bold text-blue-400">~43m</div>
                  <div className="text-xs text-slate-400">Downtime anual permitido</div>
                </div>
              </div>
            </div>

            {/* Example Session Demo */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-semibold text-emerald-300 mb-4">📊 Ejemplo Real: Sesión con 1 Chunk Fallido</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🟢</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">Session ID: session_20251118_092145</p>
                      <p className="text-xs text-slate-400">50 chunks uploaded · Duration: 15min 30s</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-8 rounded ${
                        i === 23
                          ? 'bg-red-600/80'  // Chunk 23 failed
                          : 'bg-emerald-600/80'
                      }`}
                      title={`Chunk ${i}: ${i === 23 ? 'Failed (ASR timeout)' : 'Success'}`}
                    />
                  ))}
                </div>
                <div className="flex items-start gap-2 p-3 bg-red-950/20 border border-red-700/30 rounded-lg">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-sm text-red-300 font-semibold">Chunk 23: Transcription timeout (10s)</p>
                    <p className="text-xs text-slate-400">Error: ASR provider rate limit · Marked as [gap_known]</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-emerald-950/20 border border-emerald-700/30 rounded-lg">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="text-sm text-emerald-300 font-semibold">SOAP generado exitosamente</p>
                    <p className="text-xs text-slate-400">
                      49/50 chunks = 98% success rate. Gap documentado como "intervalo no transcrito (30s)".
                      Diagnóstico y tratamiento no afectados.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Quiz */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-cyan-700/30">
              <h3 className="text-lg font-semibold text-cyan-300 mb-4">❓ Quiz: ¿Qué hacer si falla 1 de 50 chunks?</h3>
              <p className="text-slate-300 mb-4">
                Tienes una sesión de 50 chunks. El chunk #23 falla por timeout del proveedor ASR.
                Los otros 49 chunks transcribieron correctamente. <strong>¿Cuál es la acción correcta?</strong>
              </p>

              <div className="space-y-3">
                {quizOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleQuizAnswer(option.id)}
                    disabled={showFeedback}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      quizAnswer === option.id
                        ? feedbackForAnswer[option.id].correct
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : 'border-red-500 bg-red-950/30'
                        : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600'
                    } ${showFeedback ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-200">{option.label}</p>
                        <p className="text-xs text-slate-400 mt-1">{option.desc}</p>
                      </div>
                      {quizAnswer === option.id && (
                        <span className="text-2xl">{feedbackForAnswer[option.id].emoji}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* FI Feedback */}
              {showFeedback && quizAnswer && (
                <div className={`mt-6 p-4 rounded-xl border-2 ${
                  feedbackForAnswer[quizAnswer].correct
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-red-500/50 bg-red-950/20'
                } animate-fade-in-up`}>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{feedbackForAnswer[quizAnswer].emoji}</span>
                    <div>
                      <p className="font-semibold text-slate-200 mb-2">
                        {feedbackForAnswer[quizAnswer].title}
                      </p>
                      <p className="text-sm text-slate-300">
                        {feedbackForAnswer[quizAnswer].message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Continue Button */}
            {showFeedback && (
              <div className="text-center mt-8 animate-fade-in-up">
                <button
                  onClick={() => setPhase('beta')}
                  className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg hover:scale-105"
                >
                  Continuar a Beta Permanente →
                </button>
              </div>
            )}
          </div>
        );
      }

      // ============================================================
      // PHASE 3: BETA PERMANENTE (Humano)
      // ============================================================
      case "beta": {
        const consultations = [
          {
            id: 1,
            date: '2025-01-15',
            duration: '18min 45s',
            chunks: 56,
            transcriptionQuality: 92,
            soapCompleteness: 85,
            issues: [
              { type: 'warning', text: 'Chunks largos detectados (>40s) - impacta ASR accuracy' },
              { type: 'info', text: 'Dicción clara 👍 - buen audio quality' },
            ],
            improvements: [],
          },
          {
            id: 2,
            date: '2025-01-22',
            duration: '15min 20s',
            chunks: 48,
            transcriptionQuality: 96,
            soapCompleteness: 92,
            issues: [
              { type: 'info', text: 'Chunks optimizados (<30s) ✅' },
            ],
            improvements: [
              { metric: 'Transcription Quality', from: 92, to: 96, delta: '+4%' },
              { metric: 'Chunk Duration', from: '40s avg', to: '25s avg', delta: 'Optimizado' },
            ],
          },
          {
            id: 3,
            date: '2025-01-29',
            duration: '14min 10s',
            chunks: 42,
            transcriptionQuality: 98,
            soapCompleteness: 96,
            issues: [],
            improvements: [
              { metric: 'Transcription Quality', from: 96, to: 98, delta: '+2%' },
              { metric: 'SOAP Completeness', from: 92, to: 96, delta: '+4%' },
              { metric: 'Session Duration', from: '15m 20s', to: '14m 10s', delta: '-7%' },
            ],
          },
        ];

        return (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-purple-50 mb-2">
                🔄 Beta Permanente: El Usuario Nunca Sale de Iteración
              </h2>
              <p className="text-slate-400">
                Phase 3 of 8 · Hermetic Aphorism: Humano
              </p>
            </div>

            {/* Concept Explanation */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-purple-700/30">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">🧬 Mejora Continua Obsesiva</h3>
              <p className="text-slate-300 mb-3">
                Free-Intelligence <strong>nunca deja de aprender</strong> de tus patrones de uso. Cada consulta
                genera micro-insights que optimizan la siguiente sesión.
              </p>
              <p className="text-slate-300">
                No es "set and forget". Es <span className="text-purple-400 font-semibold">iteración perpetua</span>:
                detectar → optimizar → medir → repetir.
              </p>
            </div>

            {/* Timeline of 3 Consultations */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-semibold text-cyan-300 mb-6">📈 Timeline de Aprendizaje (3 Consultas Simuladas)</h3>

              <div className="space-y-6">
                {consultations.map((consultation, idx) => (
                  <div key={consultation.id} className="relative">
                    {/* Timeline connector */}
                    {idx < consultations.length - 1 && (
                      <div className="absolute left-6 top-full h-6 w-0.5 bg-gradient-to-b from-purple-500 to-transparent" />
                    )}

                    <div className={`p-5 rounded-xl border-2 transition-all ${
                      idx === 0
                        ? 'border-yellow-600/40 bg-yellow-950/10'
                        : idx === 1
                        ? 'border-purple-600/40 bg-purple-950/10'
                        : 'border-emerald-600/40 bg-emerald-950/10'
                    }`}>
                      <div className="flex items-start gap-4">
                        {/* Consultation number badge */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          idx === 0
                            ? 'bg-yellow-600/20 text-yellow-300 border-2 border-yellow-600/40'
                            : idx === 1
                            ? 'bg-purple-600/20 text-purple-300 border-2 border-purple-600/40'
                            : 'bg-emerald-600/20 text-emerald-300 border-2 border-emerald-600/40'
                        }`}>
                          #{consultation.id}
                        </div>

                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-200">{consultation.date}</p>
                              <p className="text-xs text-slate-400">
                                {consultation.duration} · {consultation.chunks} chunks
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <div className="text-right">
                                <p className="text-xs text-slate-400">Transcription</p>
                                <p className={`text-sm font-bold ${
                                  consultation.transcriptionQuality >= 95 ? 'text-emerald-400' : 'text-yellow-400'
                                }`}>
                                  {consultation.transcriptionQuality}%
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-400">SOAP</p>
                                <p className={`text-sm font-bold ${
                                  consultation.soapCompleteness >= 95 ? 'text-emerald-400' : 'text-yellow-400'
                                }`}>
                                  {consultation.soapCompleteness}%
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Issues/Observations */}
                          {consultation.issues.length > 0 && (
                            <div className="space-y-2">
                              {consultation.issues.map((issue, i) => (
                                <div
                                  key={i}
                                  className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                                    issue.type === 'warning'
                                      ? 'bg-yellow-950/30 text-yellow-300'
                                      : 'bg-blue-950/30 text-blue-300'
                                  }`}
                                >
                                  <span>{issue.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                                  <span>{issue.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Improvements (only for consultations 2 and 3) */}
                          {consultation.improvements.length > 0 && (
                            <div className="mt-3 p-3 bg-emerald-950/20 border border-emerald-700/30 rounded-lg">
                              <p className="text-xs font-semibold text-emerald-300 mb-2">✨ Mejoras aplicadas:</p>
                              <div className="space-y-1">
                                {consultation.improvements.map((improvement, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <span className="text-slate-300">{improvement.metric}</span>
                                    <span className="text-emerald-400 font-semibold">
                                      {improvement.from} → {improvement.to} ({improvement.delta})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary metrics */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-purple-950/30 rounded-lg border border-purple-700/30 text-center">
                  <div className="text-2xl font-bold text-purple-400">+6%</div>
                  <div className="text-xs text-slate-400 mt-1">Transcription Quality</div>
                </div>
                <div className="p-4 bg-emerald-950/30 rounded-lg border border-emerald-700/30 text-center">
                  <div className="text-2xl font-bold text-emerald-400">+11%</div>
                  <div className="text-xs text-slate-400 mt-1">SOAP Completeness</div>
                </div>
                <div className="p-4 bg-cyan-950/30 rounded-lg border border-cyan-700/30 text-center">
                  <div className="text-2xl font-bold text-cyan-400">-25%</div>
                  <div className="text-xs text-slate-400 mt-1">Avg Chunk Duration</div>
                </div>
              </div>
            </div>

            {/* Micro-Coaching Example */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-purple-700/30">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">🎯 Micro-Coaching en Acción</h3>
              <p className="text-slate-300 mb-4">
                Ejemplo real de pattern detection después de la consulta #1:
              </p>

              <div className="space-y-3">
                <div className="p-4 bg-purple-950/20 border-l-4 border-purple-500 rounded-r-lg">
                  <p className="text-sm text-purple-200 font-semibold mb-2">🔍 Patrón detectado:</p>
                  <p className="text-xs text-slate-300">
                    "Noté que grabas chunks de <strong>35-45 segundos</strong> en promedio.
                    Esto aumenta latencia de transcripción y reduce accuracy del ASR."
                  </p>
                </div>

                <div className="p-4 bg-cyan-950/20 border-l-4 border-cyan-500 rounded-r-lg">
                  <p className="text-sm text-cyan-200 font-semibold mb-2">💡 Recomendación obsesiva:</p>
                  <p className="text-xs text-slate-300">
                    "¿Sabías que chunks de <strong>&lt;30 segundos</strong> mejoran transcription quality en ~4-6%?
                    Tu siguiente consulta podría beneficiarse de este ajuste."
                  </p>
                </div>

                <div className="p-4 bg-emerald-950/20 border-l-4 border-emerald-500 rounded-r-lg">
                  <p className="text-sm text-emerald-200 font-semibold mb-2">✅ Resultado medible:</p>
                  <p className="text-xs text-slate-300">
                    Consulta #2: Chunks optimizados → <strong>+4% transcription quality</strong> (92% → 96%).
                    Duración promedio: 40s → 25s.
                  </p>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => setPhase('residencia')}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg hover:scale-105"
              >
                Continuar a Residencia →
              </button>
            </div>
          </div>
        );
      }

      // ============================================================
      // PHASE 4: RESIDENCIA (Dios Full-Stack)
      // ============================================================
      case "residencia":
        return (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-emerald-50 mb-2">
                🏠 Residencia: Tus Datos Viven Aquí, No en la Nube
              </h2>
              <p className="text-slate-400">
                Phase 4 of 8 · Hermetic Aphorism: Dios Full-Stack
              </p>
            </div>

            {/* Data Sovereignty Explanation */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-emerald-700/30">
              <h3 className="text-lg font-semibold text-emerald-300 mb-4">🔐 Soberanía de Datos Total</h3>
              <p className="text-slate-300 mb-3">
                Tus datos médicos <strong>nunca</strong> salen de tu infraestructura. No hay "sync a la nube",
                ni "backup externo requerido", ni "vendor lock-in". Todo reside en tu NAS.
              </p>
              <p className="text-slate-300">
                <span className="text-emerald-400 font-semibold">Tú posees los datos.</span> Free-Intelligence solo
                los observa y procesa localmente. Esto no es marketing - es arquitectura.
              </p>
            </div>

            {/* Local-First Architecture Diagram */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-semibold text-cyan-300 mb-6">📐 Arquitectura Local-First</h3>

              <div className="relative space-y-4">
                {/* Layer 1: Device/Frontend */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-4 bg-blue-950/30 border-2 border-blue-600/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">💻</span>
                      <div>
                        <p className="font-semibold text-blue-300">Device (Browser/PWA)</p>
                        <p className="text-xs text-slate-400">Audio recording · Chunk upload · UI</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl">↓</span>
                    <span className="text-xs text-slate-500">HTTPS</span>
                  </div>
                </div>

                {/* Layer 2: Backend API (LAN) */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-4 bg-purple-950/30 border-2 border-purple-600/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">⚡</span>
                      <div>
                        <p className="font-semibold text-purple-300">Backend API (Port 7001)</p>
                        <p className="text-xs text-slate-400">FastAPI · Workflows · LLM routing · LAN only</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl">↓</span>
                    <span className="text-xs text-slate-500">Local</span>
                  </div>
                </div>

                {/* Layer 3: Storage (HDF5) */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-4 bg-emerald-950/30 border-2 border-emerald-600/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🗄️</span>
                      <div>
                        <p className="font-semibold text-emerald-300">Storage Layer (HDF5)</p>
                        <p className="text-xs text-slate-400">
                          /storage/corpus.h5 · Append-only · AES-GCM encrypted
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* External Services (shown with dashed border) */}
                <div className="mt-6 p-4 border-2 border-dashed border-slate-600/40 rounded-xl bg-slate-950/40">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">☁️</span>
                    <div>
                      <p className="font-semibold text-slate-300">External APIs (Optional)</p>
                      <p className="text-xs text-slate-400">
                        Deepgram ASR · Azure GPT-4 · Claude Sonnet
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-yellow-300 bg-yellow-950/20 p-2 rounded">
                    <span>⚠️</span>
                    <span>
                      Solo audio chunks transitorios. Sin PHI. Transcripciones se almacenan localmente.
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Points */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-950/20 border border-emerald-700/30 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-300 mb-1">✅ LAN-Only Backend</p>
                  <p className="text-xs text-slate-400">
                    API accesible solo desde tu red local. No expuesto a internet.
                  </p>
                </div>
                <div className="p-3 bg-blue-950/20 border border-blue-700/30 rounded-lg">
                  <p className="text-sm font-semibold text-blue-300 mb-1">✅ Append-Only Storage</p>
                  <p className="text-xs text-slate-400">
                    HDF5 con escritura solo al final. Inmutable por diseño.
                  </p>
                </div>
                <div className="p-3 bg-purple-950/20 border border-purple-700/30 rounded-lg">
                  <p className="text-sm font-semibold text-purple-300 mb-1">✅ Zero Cloud Sync</p>
                  <p className="text-xs text-slate-400">
                    Datos nunca salen del NAS. Tú controlas backups.
                  </p>
                </div>
                <div className="p-3 bg-cyan-950/20 border border-cyan-700/30 rounded-lg">
                  <p className="text-sm font-semibold text-cyan-300 mb-1">✅ AES-GCM Encryption</p>
                  <p className="text-xs text-slate-400">
                    Sesiones finalizadas se encriptan con tu clave.
                  </p>
                </div>
              </div>
            </div>

            {/* Real-Time Storage Demo */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <h3 className="text-lg font-semibold text-emerald-300 mb-4">📁 HDF5 Storage Structure (Real-Time)</h3>
              <p className="text-slate-300 text-sm mb-4">
                Estructura actual en <code className="text-emerald-400 bg-slate-950/50 px-2 py-1 rounded">/storage/corpus.h5</code>:
              </p>

              <div className="bg-slate-950/70 p-4 rounded-lg font-mono text-xs space-y-1 border border-slate-700/50">
                <div className="text-slate-400">📦 /storage/corpus.h5</div>
                <div className="ml-4 text-cyan-300">├─ /sessions/</div>
                <div className="ml-8 text-slate-300">│  ├─ session_20251118_092145/</div>
                <div className="ml-12 text-purple-300">│  │  ├─ tasks/</div>
                <div className="ml-16 text-emerald-300">│  │  │  ├─ TRANSCRIPTION/</div>
                <div className="ml-20 text-slate-400">│  │  │  │  ├─ chunks/ (50 chunks · 49 success, 1 failed)</div>
                <div className="ml-20 text-slate-400">│  │  │  │  └─ metadata (status, progress, timing)</div>
                <div className="ml-16 text-blue-300">│  │  │  ├─ DIARIZATION/</div>
                <div className="ml-20 text-slate-400">│  │  │  │  ├─ chunks/ (speaker labels, timestamps)</div>
                <div className="ml-20 text-slate-400">│  │  │  │  └─ metadata (confidence scores)</div>
                <div className="ml-16 text-yellow-300">│  │  │  ├─ SOAP_GENERATION/</div>
                <div className="ml-20 text-slate-400">│  │  │  │  ├─ chunks/ (extracted SOAP notes)</div>
                <div className="ml-20 text-slate-400">│  │  │  │  └─ metadata (completeness: 96%)</div>
                <div className="ml-16 text-red-300">│  │  │  └─ ENCRYPTION/</div>
                <div className="ml-20 text-slate-400">│  │  │     ├─ encrypted_data (AES-GCM-256)</div>
                <div className="ml-20 text-slate-400">│  │  │     └─ metadata (finalized_at, key_id)</div>
                <div className="ml-4 text-cyan-300">├─ /embeddings/ (vector search index)</div>
                <div className="ml-4 text-purple-300">└─ /metadata/ (global stats, audit logs)</div>
              </div>

              <div className="mt-4 flex items-start gap-2 p-3 bg-emerald-950/20 border border-emerald-700/30 rounded-lg">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-sm text-emerald-300 font-semibold">Append-Only Guarantee</p>
                  <p className="text-xs text-slate-400">
                    Cada chunk se escribe una sola vez. Modificaciones = nuevos chunks con timestamps.
                    Historia completa preservada para auditoría.
                  </p>
                </div>
              </div>
            </div>

            {/* AES-GCM Encryption Explanation */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-red-700/30">
              <h3 className="text-lg font-semibold text-red-300 mb-4">🔒 AES-GCM-256 Encryption (Post-Session)</h3>
              <p className="text-slate-300 mb-4">
                Cuando finalizas una sesión, Free-Intelligence la encripta automáticamente con tu clave maestra.
                <strong> Solo tú puedes desencriptarla.</strong>
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Sesión finalizada</p>
                    <p className="text-xs text-slate-400">
                      SOAP generado ✅ → Estado cambia a FINALIZED
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600/20 flex items-center justify-center text-cyan-400 font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Encriptación automática</p>
                    <p className="text-xs text-slate-400">
                      AES-GCM-256 con tu key_id · Nonce único · Authentication tag
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Datos protegidos en reposo</p>
                    <p className="text-xs text-slate-400">
                      Transcripciones + SOAP encriptados · Solo accesibles con tu clave
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-red-950/20 border border-red-700/30 rounded-lg">
                <p className="text-xs text-red-300 font-semibold mb-1">⚠️ Responsabilidad del usuario:</p>
                <p className="text-xs text-slate-400">
                  Tú gestionas tus claves. Si pierdes la clave maestra, <strong>los datos son irrecuperables</strong>.
                  Esto es soberanía real: control total, responsabilidad total.
                </p>
              </div>
            </div>

            {/* Continue Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => setPhase('patient_setup')}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg hover:scale-105"
              >
                Continuar a Configuración →
              </button>
            </div>
          </div>
        );

      // ============================================================
      // PHASE 5: PATIENT SETUP (FI-ONBOARD-006)
      // ============================================================
      case "patient_setup": {
        const isPatientDataValid = !!(
          patientData.nombre &&
          patientData.edad !== '' &&
          patientData.genero
        );

        const handleSkipWithDemo = () => {
          const demoPatient: PatientFormData = {
            nombre: 'Juan Pérez García',
            edad: 42,
            genero: 'masculino',
            motivoConsulta: 'Control rutinario de presión arterial y niveles de glucosa',
          };
          setPatientData(demoPatient);
          localStorage.setItem('fi_demo_patient', JSON.stringify(demoPatient));
        };

        const handleContinue = () => {
          // Save patient data
          localStorage.setItem('fi_demo_patient', JSON.stringify(patientData));
          setPhase('consultation');
        };

        return (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-50 mb-2">
                👤 Configuración de Paciente Demo
              </h2>
              <p className="text-slate-400">
                Phase 5 of 8 · Real-time HDF5 Preview
              </p>
            </div>

            {/* FI Intro Message */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-emerald-700/30">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">🏠</span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-300 mb-2">
                      Free-Intelligence · Tone: Neutral (Educativo)
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Cada consulta médica genera un <strong>session único</strong> identificado por timestamp.
                      Todos los datos (transcripciones, SOAP notes, audio chunks) se almacenan en formato
                      <code className="text-emerald-400 bg-slate-950/50 px-2 py-1 rounded mx-1">HDF5</code>
                      con arquitectura <strong>append-only</strong>: solo escritura al final, nunca modificaciones.
                    </p>
                    <p className="text-sm text-slate-300 mt-3">
                      A continuación, crea un paciente demo para visualizar cómo se estructura en tiempo real.
                      <strong className="text-emerald-400"> Todo es local</strong> - ningún dato sale de tu navegador.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Grid: Form + Preview + Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Patient Form */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                  <PatientSetupForm
                    onDataChange={setPatientData}
                    onSkipDemo={handleSkipWithDemo}
                  />
                </div>
              </div>

              {/* Middle Column: HDF5 Preview */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 h-full">
                  <HDF5Preview patientData={patientData} />
                </div>
              </div>

              {/* Right Column: Flow Diagram */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 h-full">
                  <FlowDiagram />
                </div>
              </div>
            </div>

            {/* Continue Button */}
            {isPatientDataValid && (
              <div className="text-center mt-8 animate-fade-in-up">
                <button
                  onClick={handleContinue}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg hover:scale-105"
                >
                  Continuar a Consulta Demo →
                </button>
              </div>
            )}
          </div>
        );
      }

      // ============================================================
      // PHASE 6: CONSULTATION SIMULATION (FI-ONBOARD-007)
      // ============================================================
      case "consultation":
        return (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-50 mb-2">
                🎬 Primera Consulta Interactiva
              </h2>
              <p className="text-slate-400">
                Phase 6 of 8 · Simulación completa del flujo AURITY
              </p>
            </div>

            {/* FI Intro Message */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="p-6 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-cyan-700/30">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">🔬</span>
                  <div>
                    <p className="text-sm font-semibold text-cyan-300 mb-2">
                      Free-Intelligence · Tone: Obsessive (Paso a paso)
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Ahora verás el <strong>flujo completo</strong> de una consulta médica en AURITY:
                      <code className="text-cyan-400 bg-slate-950/50 px-2 py-1 rounded mx-1">Upload chunks</code> →
                      <code className="text-purple-400 bg-slate-950/50 px-2 py-1 rounded mx-1">Transcription</code> →
                      <code className="text-emerald-400 bg-slate-950/50 px-2 py-1 rounded mx-1">Diarization</code> →
                      <code className="text-yellow-400 bg-slate-950/50 px-2 py-1 rounded mx-1">SOAP Notes</code> →
                      <code className="text-red-400 bg-slate-950/50 px-2 py-1 rounded mx-1">Export</code>
                    </p>
                    <p className="text-sm text-slate-300 mt-3">
                      Fíjate cómo cada worker procesa chunks de forma asíncrona, cómo el monitor muestra
                      progreso en tiempo real (ASCII art incluido), y cómo el SOAP se genera automáticamente.
                      <strong className="text-cyan-400"> Esto es lo que verás en producción</strong>, pero sin
                      necesidad de audio real.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Consultation Simulation Component */}
            <ConsultationSimulation
              onComplete={() => setPhase('export')}
            />
          </div>
        );

      // ============================================================
      // PHASE 7: EXPORT EVIDENCE (FI-ONBOARD-008)
      // ============================================================
      case "export": {
        // Build evidence object
        const evidence: OnboardingEvidence = {
          user: {
            role: surveyData.userRole,
            clinicType: surveyData.clinicType,
            consultasPerDay: surveyData.consultasPerDay,
            aiExperience: surveyData.aiExperience,
          },
          philosophy: {
            glitchScore: 100, // Placeholder - would track quiz scores
            betaScore: 100,
            residenciaScore: 100,
          },
          patient: {
            nombre: patientData.nombre,
            edad: patientData.edad,
            genero: patientData.genero,
            motivoConsulta: patientData.motivoConsulta,
          },
          consultation: {
            mode: 'auto', // Would track actual mode selected
            timeSpent: 120, // Would track actual time
            stepsCompleted: 7,
          },
          conversation: {
            totalMessages: messages.length,
            fiTones: ['onboarding_guide', 'neutral', 'obsessive', 'empathetic'],
          },
          completedAt: new Date().toISOString(),
          sessionId: `onboarding_${new Date().toISOString().split('T')[0]}_${Date.now()}`,
        };

        return (
          <ExportReport
            evidence={evidence}
            onComplete={() => setPhase('complete')}
          />
        );
      }

      // ============================================================
      // PHASE 8: COMPLETION CELEBRATION (FI-ONBOARD-008)
      // ============================================================
      case "complete":
        return (
          <CompletionCelebration
            userName={patientData.nombre}
            completionTimeMinutes={20} // Would track actual time
            quizScore={100} // Would track actual quiz score
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Abstract geometric background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-emerald-400 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-cyan-400 rounded-full blur-3xl" />
      </div>

      {/* AURITY Banner */}
      <AurityBanner />

      {/* Main Content */}
      <main className="relative flex-1 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="bg-slate-900/50 p-8 rounded-xl border border-slate-800">
          {renderPhase()}

          {/* Progress indicator (9 phases total) */}
          <div className="mt-12 flex justify-center space-x-2">
            {['welcome', 'survey', 'glitch', 'beta', 'residencia', 'patient_setup', 'consultation', 'export', 'complete'].map((p, i) => {
              const allPhases = ['welcome', 'survey', 'glitch', 'beta', 'residencia', 'patient_setup', 'consultation', 'export', 'complete'];
              const currentIndex = allPhases.indexOf(phase);

              return (
                <div
                  key={p}
                  className={`h-2 w-8 rounded-full transition-all duration-300 ${
                    phase === p
                      ? 'bg-emerald-500 w-12'  // Current phase is wider
                      : i < currentIndex
                      ? 'bg-emerald-700'       // Completed phases
                      : 'bg-slate-700'         // Future phases
                  }`}
                />
              );
            })}
          </div>

          {/* Skip Button (only show if not on complete phase) */}
          {phase !== 'complete' && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowSkipModal(true)}
                className="text-sm text-slate-400 hover:text-slate-300 underline transition-colors duration-200"
                aria-label="Saltar onboarding"
              >
                Saltar onboarding
              </button>
            </div>
          )}

          {/* Skip Confirmation Modal */}
          {showSkipModal && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="skip-modal-title"
            >
              <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
                <h3
                  id="skip-modal-title"
                  className="text-xl font-bold text-slate-200 mb-4"
                >
                  ⚠️ ¿Saltar onboarding?
                </h3>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Perderás la oportunidad de aprender sobre la filosofía de Free-Intelligence
                  y cómo maximizar su potencial. ¿Estás seguro?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSkipModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors duration-200"
                    aria-label="Cancelar y continuar onboarding"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSkipConfirm}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors duration-200"
                    aria-label="Confirmar saltar onboarding"
                  >
                    Saltar de todos modos
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
