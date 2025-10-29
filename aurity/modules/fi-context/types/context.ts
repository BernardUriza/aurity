/**
 * FI-CONTEXT Module - Context Types
 *
 * Types for Free Intelligence context management
 * Implements no_context_loss policy
 */

export interface Session {
  session_id: string;              // session_YYYYMMDD_HHMMSS
  thread_id?: string;              // UUID v4 (optional)
  user_id?: string;                // User identifier
  created_at: string;              // ISO 8601
  last_active: string;             // ISO 8601
  interaction_count: number;       // Total interactions in session
  is_persisted: boolean;           // Auto-saved to storage
}

export interface ContextState {
  currentSession: Session | null;
  sessions: Session[];             // All available sessions
  isLoading: boolean;
  error: Error | null;
}

export interface ContextActions {
  // Session management
  createSession: () => Promise<Session>;
  resumeSession: (sessionId: string) => Promise<Session>;
  endSession: (sessionId: string, confirmed: boolean) => Promise<void>;

  // Auto-persistence
  persistSession: (session: Session) => Promise<void>;
  recoverSession: () => Promise<Session | null>;

  // Context continuity
  preventContextLoss: () => void;
  warnBeforeReset: (action: string) => Promise<boolean>;
}

export interface NoContextLossPolicyConfig {
  autosave: boolean;               // Auto-save to storage (default: true)
  autosaveInterval: number;        // Autosave interval in ms (default: 5000)
  warnOnReset: boolean;            // Show warning modal (default: true)
  warnOnNavigateAway: boolean;     // Warn on page leave (default: true)
  recoverOnLoad: boolean;          // Auto-recover session on page load (default: true)
  maxSessionHistory: number;       // Max sessions to keep (default: 100)
}

export interface WarningModalProps {
  isOpen: boolean;
  action: string;                  // e.g., "reset conversation", "close window"
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

export interface ContextRecoveryResult {
  success: boolean;
  session: Session | null;
  interactionsRecovered: number;
  error?: string;
}
