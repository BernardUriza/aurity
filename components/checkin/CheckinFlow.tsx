/**
 * CheckinFlow - Main Check-in Flow Component
 *
 * Card: FI-CHECKIN-001
 * Orchestrates the full check-in flow on patient's mobile device
 */

'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  User,
  Calendar,
  Clock,
  Hash,
  CreditCard,
  FileText,
  Upload,
} from 'lucide-react';
import type {
  CheckinStep,
  CheckinSession,
  IdentifyPatientResponse,
  PendingAction,
  CompleteCheckinResponse,
} from '@/types/checkin';
import {
  checkinAPI,
  formatCheckinCode,
  isValidCurp,
  formatWaitTime,
  getActionIcon,
} from '@/lib/api/checkin';

// =============================================================================
// PROPS & STATE TYPES
// =============================================================================

interface CheckinFlowProps {
  clinicId: string;
  clinicName?: string;
  /** Called when check-in is complete */
  onComplete?: (response: CompleteCheckinResponse) => void;
  /** Called when user cancels */
  onCancel?: () => void;
}

type IdentificationMethod = 'code' | 'curp' | 'name_dob';

interface FlowState {
  step: CheckinStep;
  session: CheckinSession | null;
  identificationMethod: IdentificationMethod;
  patientData: IdentifyPatientResponse | null;
  pendingActions: PendingAction[];
  completedActions: string[];
  skippedActions: string[];
  error: string | null;
  isLoading: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CheckinFlow({
  clinicId,
  clinicName = 'la clínica',
  onComplete,
  onCancel,
}: CheckinFlowProps) {
  const [state, setState] = useState<FlowState>({
    step: 'identify',
    session: null,
    identificationMethod: 'code',
    patientData: null,
    pendingActions: [],
    completedActions: [],
    skippedActions: [],
    error: null,
    isLoading: false,
  });

  // Form state for identification
  const [checkinCode, setCheckinCode] = useState('');
  const [curp, setCurp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Start session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const session = await checkinAPI.startSession(clinicId, 'mobile');
        setState(prev => ({ ...prev, session }));
      } catch (error) {
        console.error('Failed to start session:', error);
        // Continue anyway - session is optional for MVP
      }
    }
    initSession();
  }, [clinicId]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleIdentify = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let response: IdentifyPatientResponse;

      switch (state.identificationMethod) {
        case 'code':
          if (checkinCode.replace('-', '').length !== 6) {
            throw new Error('El código debe tener 6 dígitos');
          }
          response = await checkinAPI.identifyByCode({
            clinic_id: clinicId,
            checkin_code: checkinCode.replace('-', ''),
          });
          break;

        case 'curp':
          if (!isValidCurp(curp)) {
            throw new Error('CURP inválido');
          }
          response = await checkinAPI.identifyByCurp({
            clinic_id: clinicId,
            curp: curp.toUpperCase(),
          });
          break;

        case 'name_dob':
          if (!firstName.trim() || !lastName.trim() || !dateOfBirth) {
            throw new Error('Completa todos los campos');
          }
          response = await checkinAPI.identifyByName({
            clinic_id: clinicId,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            date_of_birth: dateOfBirth,
          });
          break;

        default:
          throw new Error('Método de identificación no válido');
      }

      if (!response.success || !response.patient) {
        throw new Error(response.error || 'No se encontró tu cita');
      }

      setState(prev => ({
        ...prev,
        step: 'confirm_identity',
        patientData: response,
        pendingActions: response.pending_actions || [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error de identificación',
        isLoading: false,
      }));
    }
  };

  const handleConfirmIdentity = (confirmed: boolean) => {
    if (confirmed) {
      // Check if there are pending actions
      const blockingActions = state.pendingActions.filter(a => a.is_blocking && a.status === 'pending');

      if (blockingActions.length > 0 || state.pendingActions.length > 0) {
        setState(prev => ({ ...prev, step: 'pending_actions' }));
      } else {
        // No pending actions, complete check-in
        handleCompleteCheckin();
      }
    } else {
      // Reset to identification
      setState(prev => ({
        ...prev,
        step: 'identify',
        patientData: null,
        error: null,
      }));
      setCheckinCode('');
      setCurp('');
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
    }
  };

  const handleCompleteAction = async (actionId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await checkinAPI.completeAction(actionId);
      setState(prev => ({
        ...prev,
        completedActions: [...prev.completedActions, actionId],
        pendingActions: prev.pendingActions.map(a =>
          a.action_id === actionId ? { ...a, status: 'completed' as const } : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error completando acción',
        isLoading: false,
      }));
    }
  };

  const handleSkipAction = async (actionId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await checkinAPI.skipAction(actionId);
      setState(prev => ({
        ...prev,
        skippedActions: [...prev.skippedActions, actionId],
        pendingActions: prev.pendingActions.map(a =>
          a.action_id === actionId ? { ...a, status: 'skipped' as const } : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error omitiendo acción',
        isLoading: false,
      }));
    }
  };

  const handleCompleteCheckin = async () => {
    if (!state.patientData?.appointment?.appointment_id || !state.session?.session_id) {
      // For MVP without backend, simulate success
      setState(prev => ({ ...prev, step: 'success' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await checkinAPI.completeCheckin({
        session_id: state.session!.session_id,
        appointment_id: state.patientData!.appointment!.appointment_id,
        completed_actions: state.completedActions,
        skipped_actions: state.skippedActions,
      });

      if (response.success) {
        setState(prev => ({ ...prev, step: 'success', isLoading: false }));
        onComplete?.(response);
      } else {
        throw new Error(response.error || 'Error completando check-in');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error de check-in',
        isLoading: false,
      }));
    }
  };

  const canProceedFromActions = () => {
    const blockingPending = state.pendingActions.filter(
      a => a.is_blocking && a.status === 'pending'
    );
    return blockingPending.length === 0;
  };

  // ---------------------------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------------------------

  const renderIdentificationStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center">
          <User className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Check-in</h2>
        <p className="text-slate-400">
          Bienvenido a {clinicName}
        </p>
      </div>

      {/* Error */}
      {state.error && (
        <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{state.error}</p>
        </div>
      )}

      {/* Method Selector */}
      <div className="grid grid-cols-3 gap-2">
        {(['code', 'curp', 'name_dob'] as const).map((method) => (
          <button
            key={method}
            onClick={() => setState(prev => ({ ...prev, identificationMethod: method, error: null }))}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${state.identificationMethod === method
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }
            `}
          >
            {method === 'code' && 'Código'}
            {method === 'curp' && 'CURP'}
            {method === 'name_dob' && 'Nombre'}
          </button>
        ))}
      </div>

      {/* Identification Forms */}
      <div className="space-y-4">
        {state.identificationMethod === 'code' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Código de cita (6 dígitos)
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={checkinCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                  setCheckinCode(formatCheckinCode(value));
                }}
                placeholder="123-456"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                maxLength={7}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Lo recibiste por SMS o email al agendar tu cita
            </p>
          </div>
        )}

        {state.identificationMethod === 'curp' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              CURP
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={curp}
                onChange={(e) => setCurp(e.target.value.toUpperCase().slice(0, 18))}
                placeholder="GARM850101HDFRRL09"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                maxLength={18}
              />
            </div>
          </div>
        )}

        {state.identificationMethod === 'name_dob' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre(s)
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="María"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Apellidos
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="García Ramírez"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={handleIdentify}
          disabled={state.isLoading}
          className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {state.isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Continuar
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderConfirmIdentityStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-600/20 to-green-600/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">¿Eres tú?</h2>
        <p className="text-slate-400">
          Confirma que estos datos son correctos
        </p>
      </div>

      {/* Patient Info Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center">
            <User className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">
              {state.patientData?.patient?.full_name}
            </p>
            {state.patientData?.patient?.masked_curp && (
              <p className="text-sm text-slate-400 font-mono">
                {state.patientData.patient.masked_curp}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700 space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-sm text-slate-400">Cita programada</p>
              <p className="text-white">
                {state.patientData?.appointment?.scheduled_at
                  ? new Date(state.patientData.appointment.scheduled_at).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Hoy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-sm text-slate-400">Doctor</p>
              <p className="text-white">
                {state.patientData?.appointment?.doctor_name || 'Dr. Asignado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => handleConfirmIdentity(false)}
          className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          No soy yo
        </button>
        <button
          onClick={() => handleConfirmIdentity(true)}
          className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Sí, soy yo
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderPendingActionsStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Antes de continuar</h2>
        <p className="text-slate-400">
          Completa estas acciones para finalizar tu check-in
        </p>
      </div>

      {/* Error */}
      {state.error && (
        <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{state.error}</p>
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-3">
        {state.pendingActions.map((action) => (
          <div
            key={action.action_id}
            className={`
              p-4 rounded-xl border transition-all
              ${action.status === 'completed'
                ? 'bg-emerald-950/20 border-emerald-600/30'
                : action.status === 'skipped'
                ? 'bg-slate-800/30 border-slate-700/50 opacity-60'
                : 'bg-slate-800/50 border-slate-700'
              }
            `}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                ${action.status === 'completed'
                  ? 'bg-emerald-600/20'
                  : 'bg-slate-700/50'
                }
              `}>
                <span className="text-xl">{getActionIcon(action.action_type)}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{action.title}</p>
                  {action.is_required && action.status === 'pending' && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                      Requerido
                    </span>
                  )}
                  {action.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                {action.description && (
                  <p className="text-sm text-slate-400 mt-1">{action.description}</p>
                )}
                {action.amount && (
                  <p className="text-lg font-semibold text-white mt-2">
                    ${action.amount.toLocaleString()} {action.currency || 'MXN'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {action.status === 'pending' && (
                <div className="flex gap-2">
                  {!action.is_required && (
                    <button
                      onClick={() => handleSkipAction(action.action_id)}
                      disabled={state.isLoading}
                      className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Omitir
                    </button>
                  )}
                  <button
                    onClick={() => handleCompleteAction(action.action_id)}
                    disabled={state.isLoading}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                  >
                    {action.action_type.startsWith('pay_') ? 'Pagar' : 'Completar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setState(prev => ({ ...prev, step: 'confirm_identity' }))}
          className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Atrás
        </button>
        <button
          onClick={handleCompleteCheckin}
          disabled={!canProceedFromActions() || state.isLoading}
          className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {state.isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Completar Check-in
              <CheckCircle className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      {/* Success Animation */}
      <div className="relative">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-600/30 to-green-600/30 flex items-center justify-center animate-pulse">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </div>
        <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-emerald-500/30 animate-ping" />
      </div>

      {/* Message */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          ¡Check-in completado!
        </h2>
        <p className="text-lg text-emerald-400">
          {state.patientData?.patient?.full_name}
        </p>
      </div>

      {/* Wait Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-semibold text-white">
            Tiempo estimado de espera
          </span>
        </div>
        <p className="text-4xl font-bold text-indigo-400 mb-2">
          ~15 min
        </p>
        <p className="text-slate-400">
          Te llamaremos por tu nombre cuando sea tu turno
        </p>
      </div>

      {/* Tips */}
      <div className="bg-indigo-950/30 border border-indigo-600/30 rounded-xl p-4">
        <p className="text-sm text-indigo-300">
          Mantén tu celular con sonido para recibir notificaciones
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={onCancel}
        className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
      >
        Cerrar
      </button>
    </div>
  );

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-md mx-auto">
        {/* Logo/Header */}
        <div className="flex items-center justify-center gap-2 mb-8 pt-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <span className="text-lg font-semibold text-white">AURITY</span>
        </div>

        {/* Progress Indicator */}
        {state.step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {(['identify', 'confirm_identity', 'pending_actions'] as const).map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${state.step === step
                      ? 'bg-indigo-600 text-white'
                      : (['confirm_identity', 'pending_actions'].indexOf(state.step) > ['identify', 'confirm_identity', 'pending_actions'].indexOf(step) - 1)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-500'
                    }
                  `}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div className={`
                    w-12 h-1 mx-1 rounded
                    ${(['confirm_identity', 'pending_actions'].indexOf(state.step) > index)
                      ? 'bg-emerald-600'
                      : 'bg-slate-800'
                    }
                  `} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          {state.step === 'identify' && renderIdentificationStep()}
          {state.step === 'confirm_identity' && renderConfirmIdentityStep()}
          {state.step === 'pending_actions' && renderPendingActionsStep()}
          {state.step === 'success' && renderSuccessStep()}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Powered by AURITY · Sistema On-Premise
        </p>
      </div>
    </div>
  );
}
