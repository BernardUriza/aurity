/**
 * FI-CONTEXT Module - Session Persistence Service
 *
 * Handles automatic session persistence to browser storage
 * Implements no_context_loss policy with auto-save
 */

import type { Session, ContextRecoveryResult } from '../types/context';

const STORAGE_KEY = 'fi_session_current';
const STORAGE_KEY_HISTORY = 'fi_session_history';
const STORAGE_KEY_POLICY = 'fi_no_context_loss_policy';

export class SessionPersistence {
  private autosaveInterval: number;
  private autosaveTimer: NodeJS.Timeout | null = null;

  constructor(autosaveInterval: number = 5000) {
    this.autosaveInterval = autosaveInterval;
  }

  /**
   * Save current session to localStorage
   */
  async saveSession(session: Session): Promise<void> {
    try {
      const sessionData = {
        ...session,
        last_active: new Date().toISOString(),
        is_persisted: true,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));

      // Also add to history
      this.addToHistory(sessionData);

      console.log('[SessionPersistence] Session saved:', session.session_id);
    } catch (error) {
      console.error('[SessionPersistence] Failed to save session:', error);
      throw new Error('Failed to persist session to storage');
    }
  }

  /**
   * Load current session from localStorage
   */
  async loadSession(): Promise<Session | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const session: Session = JSON.parse(data);

      // Validate session structure
      if (!session.session_id || !session.created_at) {
        console.warn('[SessionPersistence] Invalid session data, clearing');
        this.clearSession();
        return null;
      }

      console.log('[SessionPersistence] Session loaded:', session.session_id);
      return session;
    } catch (error) {
      console.error('[SessionPersistence] Failed to load session:', error);
      return null;
    }
  }

  /**
   * Clear current session from storage
   */
  clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[SessionPersistence] Session cleared');
  }

  /**
   * Start auto-save timer
   */
  startAutosave(getSession: () => Session | null): void {
    if (this.autosaveTimer) {
      console.warn('[SessionPersistence] Autosave already running');
      return;
    }

    console.log(`[SessionPersistence] Starting autosave (interval: ${this.autosaveInterval}ms)`);

    this.autosaveTimer = setInterval(() => {
      const session = getSession();
      if (session) {
        this.saveSession(session).catch((err) => {
          console.error('[SessionPersistence] Autosave failed:', err);
        });
      }
    }, this.autosaveInterval);
  }

  /**
   * Stop auto-save timer
   */
  stopAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
      console.log('[SessionPersistence] Autosave stopped');
    }
  }

  /**
   * Add session to history
   */
  private addToHistory(session: Session): void {
    try {
      const historyData = localStorage.getItem(STORAGE_KEY_HISTORY);
      const history: Session[] = historyData ? JSON.parse(historyData) : [];

      // Remove existing entry if present (update)
      const filteredHistory = history.filter(
        (s) => s.session_id !== session.session_id
      );

      // Add to beginning (most recent first)
      filteredHistory.unshift(session);

      // Keep only last 100 sessions
      const trimmedHistory = filteredHistory.slice(0, 100);

      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('[SessionPersistence] Failed to update history:', error);
    }
  }

  /**
   * Get session history
   */
  getHistory(): Session[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[SessionPersistence] Failed to load history:', error);
      return [];
    }
  }

  /**
   * Recover session on page load
   */
  async recoverSession(): Promise<ContextRecoveryResult> {
    try {
      const session = await this.loadSession();

      if (!session) {
        return {
          success: false,
          session: null,
          interactionsRecovered: 0,
          error: 'No session found in storage',
        };
      }

      // Check if session is stale (older than 7 days)
      const lastActive = new Date(session.last_active);
      const now = new Date();
      const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceActive > 7) {
        console.warn('[SessionPersistence] Session is stale (>7 days), not recovering');
        return {
          success: false,
          session: null,
          interactionsRecovered: 0,
          error: 'Session is too old (>7 days)',
        };
      }

      console.log('[SessionPersistence] Session recovered:', session.session_id);

      return {
        success: true,
        session,
        interactionsRecovered: session.interaction_count,
      };
    } catch (error) {
      console.error('[SessionPersistence] Recovery failed:', error);
      return {
        success: false,
        session: null,
        interactionsRecovered: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save policy configuration
   */
  savePolicyConfig(config: Record<string, any>): void {
    localStorage.setItem(STORAGE_KEY_POLICY, JSON.stringify(config));
  }

  /**
   * Load policy configuration
   */
  loadPolicyConfig(): Record<string, any> | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_POLICY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[SessionPersistence] Failed to load policy config:', error);
      return null;
    }
  }
}

// Singleton instance
export const sessionPersistence = new SessionPersistence();
