'use client';

/**
 * FI-CONTEXT Module - Context Provider
 *
 * React Context Provider for Free Intelligence session management
 * Implements no_context_loss policy with auto-save and recovery
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  Session,
  ContextState,
  ContextActions,
  NoContextLossPolicyConfig,
} from '../types/context';
import { sessionPersistence } from '../services/SessionPersistence';
import { WarningModal } from '../components/WarningModal';

// Default policy configuration
const DEFAULT_POLICY: NoContextLossPolicyConfig = {
  autosave: true,
  autosaveInterval: 5000, // 5 seconds
  warnOnReset: true,
  warnOnNavigateAway: true,
  recoverOnLoad: true,
  maxSessionHistory: 100,
};

interface FIContextValue extends ContextState, ContextActions {
  policy: NoContextLossPolicyConfig;
}

const FIContext = createContext<FIContextValue | null>(null);

interface ContextProviderProps {
  children: React.ReactNode;
  policy?: Partial<NoContextLossPolicyConfig>;
}

export const ContextProvider: React.FC<ContextProviderProps> = ({
  children,
  policy: customPolicy,
}) => {
  const policy = { ...DEFAULT_POLICY, ...customPolicy };

  // State
  const [state, setState] = useState<ContextState>({
    currentSession: null,
    sessions: [],
    isLoading: true,
    error: null,
  });

  // Warning modal state
  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    action: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    action: '',
    onConfirm: () => {},
  });

  // Ref to prevent double-recovery
  const hasRecovered = useRef(false);

  /**
   * Generate session ID with format: session_YYYYMMDD_HHMMSS
   */
  const generateSessionId = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `session_${year}${month}${day}_${hours}${minutes}${seconds}`;
  };

  /**
   * Create new session
   */
  const createSession = useCallback(async (): Promise<Session> => {
    const session: Session = {
      session_id: generateSessionId(),
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      interaction_count: 0,
      is_persisted: false,
    };

    setState((prev) => ({
      ...prev,
      currentSession: session,
      sessions: [session, ...prev.sessions],
    }));

    // Auto-save if enabled
    if (policy.autosave) {
      await sessionPersistence.saveSession(session);
    }

    console.log('[ContextProvider] Session created:', session.session_id);

    return session;
  }, [policy.autosave]);

  /**
   * Resume existing session
   */
  const resumeSession = useCallback(async (sessionId: string): Promise<Session> => {
    const history = sessionPersistence.getHistory();
    const session = history.find((s) => s.session_id === sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    setState((prev) => ({
      ...prev,
      currentSession: session,
    }));

    console.log('[ContextProvider] Session resumed:', sessionId);

    return session;
  }, []);

  /**
   * End session with warning
   */
  const endSession = useCallback(
    async (sessionId: string, confirmed: boolean): Promise<void> => {
      if (!confirmed && policy.warnOnReset) {
        // Show warning modal
        await new Promise<void>((resolve) => {
          setWarningModal({
            isOpen: true,
            action: 'end this session',
            onConfirm: () => {
              setWarningModal({ isOpen: false, action: '', onConfirm: () => {} });
              resolve();
            },
          });
        });
      }

      // Clear current session
      setState((prev) => ({
        ...prev,
        currentSession: null,
      }));

      sessionPersistence.clearSession();

      console.log('[ContextProvider] Session ended:', sessionId);
    },
    [policy.warnOnReset]
  );

  /**
   * Persist session to storage
   */
  const persistSession = useCallback(async (session: Session): Promise<void> => {
    await sessionPersistence.saveSession(session);
  }, []);

  /**
   * Recover session from storage
   */
  const recoverSession = useCallback(async (): Promise<Session | null> => {
    if (!policy.recoverOnLoad) return null;

    const result = await sessionPersistence.recoverSession();

    if (result.success && result.session) {
      setState((prev) => ({
        ...prev,
        currentSession: result.session,
        sessions: [result.session!, ...prev.sessions],
      }));

      console.log('[ContextProvider] Session recovered:', result.session.session_id);
      return result.session;
    }

    return null;
  }, [policy.recoverOnLoad]);

  /**
   * Prevent context loss with beforeunload
   */
  const preventContextLoss = useCallback(() => {
    if (!policy.warnOnNavigateAway) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.currentSession) {
        e.preventDefault();
        e.returnValue = 'You have an active session. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.currentSession, policy.warnOnNavigateAway]);

  /**
   * Show warning before destructive action
   */
  const warnBeforeReset = useCallback(
    async (action: string): Promise<boolean> => {
      if (!policy.warnOnReset) return true;

      return new Promise<boolean>((resolve) => {
        setWarningModal({
          isOpen: true,
          action,
          onConfirm: () => {
            setWarningModal({ isOpen: false, action: '', onConfirm: () => {} });
            resolve(true);
          },
        });
      });
    },
    [policy.warnOnReset]
  );

  /**
   * Auto-recovery on mount
   */
  useEffect(() => {
    if (hasRecovered.current) return;
    hasRecovered.current = true;

    const recover = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        await recoverSession();
      } catch (error) {
        console.error('[ContextProvider] Recovery failed:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error('Recovery failed'),
        }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    recover();
  }, [recoverSession]);

  /**
   * Auto-save on interval
   */
  useEffect(() => {
    if (!policy.autosave || !state.currentSession) return;

    sessionPersistence.startAutosave(() => state.currentSession);

    return () => {
      sessionPersistence.stopAutosave();
    };
  }, [policy.autosave, state.currentSession]);

  /**
   * Prevent context loss on navigate away
   */
  useEffect(() => {
    return preventContextLoss();
  }, [preventContextLoss]);

  const value: FIContextValue = {
    ...state,
    policy,
    createSession,
    resumeSession,
    endSession,
    persistSession,
    recoverSession,
    preventContextLoss,
    warnBeforeReset,
  };

  return (
    <FIContext.Provider value={value}>
      {children}

      {/* Warning Modal */}
      <WarningModal
        isOpen={warningModal.isOpen}
        action={warningModal.action}
        onConfirm={warningModal.onConfirm}
        onCancel={() => setWarningModal({ isOpen: false, action: '', onConfirm: () => {} })}
      />
    </FIContext.Provider>
  );
};

ContextProvider.displayName = 'FIContextProvider';

/**
 * Hook to use FI Context
 */
export const useFIContext = (): FIContextValue => {
  const context = useContext(FIContext);

  if (!context) {
    throw new Error('useFIContext must be used within ContextProvider');
  }

  return context;
};
