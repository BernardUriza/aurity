/**
 * useFIConversation Hook
 *
 * Card: FI-ONBOARD-001
 * React hook for managing Free-Intelligence conversation state
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { assistantAPI } from '@/lib/api/assistant';
import { mergeMessages, areMessagesEqual } from '@/lib/chat/sync';
import type {
  FIMessage,
  FIChatContext,
  FIChatResponse,
  OnboardingPhase,
  FITone,
} from '@/types/assistant';
import type { IMessageStorage } from '@/lib/chat/storage';
import type { IBackendSync, IRealtimeSync } from '@/lib/chat/sync-strategy';
import { createMessageStorage } from '@/lib/chat/storage';
import { BackendSyncStrategy, WebSocketSyncStrategy } from '@/lib/chat/sync-strategy';

/**
 * Hook options (SOLID: Dependency Injection)
 */
export interface UseFIConversationOptions {
  /** Current onboarding phase */
  phase?: OnboardingPhase;

  /** Additional context for personalization */
  context?: Omit<FIChatContext, 'phase'>;

  /** LocalStorage key for persistence (optional) */
  storageKey?: string;

  /** Auto-load introduction on mount */
  autoIntroduction?: boolean;

  // ========== Dependency Injection (SOLID: Dependency Inversion) ==========

  /**
   * Message storage strategy (defaults to createMessageStorage).
   * Inject custom implementation for testing or alternative storage.
   */
  storage?: IMessageStorage;

  /**
   * Backend sync strategy (defaults to BackendSyncStrategy).
   * Inject custom implementation for testing or alternative backends.
   */
  backendSync?: IBackendSync;

  /**
   * Real-time sync strategy (defaults to WebSocketSyncStrategy).
   * Inject custom implementation for testing or alternative protocols (SSE, polling).
   */
  realtimeSync?: IRealtimeSync;
}

/**
 * Hook return value
 */
export interface UseFIConversationReturn {
  /** Conversation messages */
  messages: FIMessage[];

  /** Loading state */
  loading: boolean;

  /** Error state */
  error: string | null;

  /** Send user message to FI */
  sendMessage: (message: string) => Promise<FIChatResponse | null>;

  /** Get FI introduction */
  getIntroduction: () => Promise<FIChatResponse | null>;

  /** Clear conversation */
  clearConversation: () => void;

  /** Retry last failed message */
  retry: () => Promise<void>;

  /** Is FI typing? */
  isTyping: boolean;

  /** Loading initial conversation from storage/backend */
  loadingInitial: boolean;

  /** Load older messages (for infinite scroll) */
  loadOlderMessages: () => Promise<void>;

  /** Are there more messages to load? */
  hasMoreMessages: boolean;

  /** Is loading older messages? */
  loadingOlder: boolean;
}

/**
 * React hook for managing FI conversation
 *
 * @example
 * ```tsx
 * function OnboardingWelcome() {
 *   const { messages, loading, sendMessage, getIntroduction } = useFIConversation({
 *     phase: 'welcome',
 *     context: { userRole: 'medico_general' },
 *     autoIntroduction: true,
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map((msg, i) => (
 *         <FIMessageBubble key={i} message={msg} />
 *       ))}
 *       {loading && <FITypingIndicator />}
 *       <FIChatInput onSend={sendMessage} disabled={loading} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useFIConversation(options: UseFIConversationOptions = {}): UseFIConversationReturn {
  const {
    phase,
    context = {},
    storageKey,
    autoIntroduction = false,
    storage: injectedStorage,
    backendSync: injectedBackendSync,
    realtimeSync: injectedRealtimeSync,
  } = options;

  // Memoize strategies to prevent infinite loops (SOLID: Dependency Inversion)
  const storage = useMemo(
    () => injectedStorage || createMessageStorage(!!storageKey),
    [injectedStorage, storageKey]
  );

  const backendSync = useMemo(
    () => injectedBackendSync || new BackendSyncStrategy(),
    [injectedBackendSync]
  );

  const realtimeSync = useMemo(
    () => injectedRealtimeSync || new WebSocketSyncStrategy(),
    [injectedRealtimeSync]
  );

  const [messages, setMessages] = useState<FIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true); // Loading conversation history
  const lastMessageRef = useRef<string | null>(null);
  const introductionLoadedRef = useRef(false);

  // Infinite scroll state
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [paginationOffset, setPaginationOffset] = useState(0);

  // WebSocket real-time sync (cross-device)
  // SOLID: Dependency Inversion - use IRealtimeSync interface
  // IMPORTANT: Only connect AFTER initial load completes to avoid race conditions
  useEffect(() => {
    const doctorId = context?.doctor_id;
    const enabled = !!doctorId && !!storageKey;

    // Wait for initial load to complete before connecting WebSocket
    if (!enabled || loadingInitial) {
      return;
    }

    console.log('[WebSocket] Connecting after initial load complete...');

    // Connect to real-time sync
    realtimeSync.connect(doctorId, (message) => {
      console.log('[WebSocket] Received message:', message);

      // Add message from real-time sync (from another device)
      setMessages(prev => {
        // Avoid duplicates: check if message already exists
        const exists = prev.some(
          m => m.timestamp === message.timestamp &&
               m.role === message.role &&
               m.content.substring(0, 50) === message.content.substring(0, 50)
        );

        if (exists) {
          console.log('[WebSocket] Message already exists, skipping');
          return prev; // Already have this message
        }

        console.log('[WebSocket] Adding new message to state');
        // Append new message from real-time sync
        return [...prev, message];
      });
    });

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Disconnecting...');
      realtimeSync.disconnect();
    };
  }, [context?.doctor_id, storageKey, realtimeSync, loadingInitial]);

  // Load messages from storage on mount (instant UX)
  // SOLID: Dependency Inversion - use IMessageStorage interface
  useEffect(() => {
    if (storageKey) {
      const loaded = storage.load(storageKey);
      if (loaded.length > 0) {
        setMessages(loaded);
      }
    }

    // Initial load complete (either from storage or empty)
    setLoadingInitial(false);
  }, [storageKey, storage]);

  // Background sync with backend (cross-device consistency)
  // SOLID: Dependency Inversion - use IBackendSync interface
  useEffect(() => {
    const doctorId = context?.doctor_id;

    // Only sync for authenticated users with backend memory
    if (!doctorId || !storageKey) {
      return;
    }

    const syncWithBackend = async () => {
      try {
        // Fetch latest messages from backend (IBackendSync interface)
        const backendMessages = await backendSync.sync(doctorId, phase, 50);

        if (backendMessages.length === 0) {
          return; // No history yet (new user)
        }

        // Merge local storage + backend (dedup)
        setMessages(prevMessages => {
          const merged = mergeMessages(prevMessages, backendMessages);

          // Only update if different (avoid unnecessary re-renders)
          if (areMessagesEqual(prevMessages, merged)) {
            return prevMessages;
          }

          // Update storage with merged messages (IMessageStorage interface)
          if (storageKey) {
            storage.save(storageKey, merged);
          }

          return merged;
        });
      } catch (err) {
        console.error('Backend sync failed (non-critical):', err);
        // Don't show error to user - storage cache is still valid
      }
    };

    // Initial sync after mount (100ms delay)
    const initialTimeoutId = setTimeout(syncWithBackend, 100);

    // Periodic sync every 30 seconds (catch changes from other devices)
    const periodicIntervalId = setInterval(syncWithBackend, 30000);

    return () => {
      clearTimeout(initialTimeoutId);
      clearInterval(periodicIntervalId);
    };
  }, [context?.doctor_id, storageKey, phase, backendSync, storage]);

  // Save messages to storage when they change
  // SOLID: Dependency Inversion - use IMessageStorage interface
  useEffect(() => {
    if (storageKey && messages.length > 0) {
      storage.save(storageKey, messages);
    }
  }, [storageKey, messages, storage]);

  // Auto-load introduction on mount (AFTER initial load completes)
  useEffect(() => {
    // Wait for initial load to complete before checking if introduction is needed
    if (!loadingInitial && autoIntroduction && !introductionLoadedRef.current && messages.length === 0) {
      introductionLoadedRef.current = true;
      getIntroduction();
    }
  }, [autoIntroduction, messages.length, loadingInitial]);

  /**
   * Get FI introduction
   */
  const getIntroduction = useCallback(async (): Promise<FIChatResponse | null> => {
    setLoading(true);
    setError(null);
    setIsTyping(true);

    try {
      const response = await assistantAPI.introduction({
        ...context,
        phase,
      });

      const fiMessage: FIMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(), // Generate timestamp client-side
        metadata: {
          tone: response.persona as FITone, // Map persona to tone (for UI styling)
          phase,
        },
      };

      // SAFEGUARD: Only set introduction if no messages exist (prevent overwriting history)
      setMessages(prev => prev.length === 0 ? [fiMessage] : prev);
      setIsTyping(false);
      setLoading(false);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get introduction';
      setError(errorMessage);
      setIsTyping(false);
      setLoading(false);
      return null;
    }
  }, [phase, context]);

  /**
   * Send user message to FI
   */
  const sendMessage = useCallback(async (userMessage: string): Promise<FIChatResponse | null> => {
    if (!userMessage.trim()) {
      return null;
    }

    setLoading(true);
    setError(null);
    lastMessageRef.current = userMessage;

    // Add user message immediately
    const userMsg: FIMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      metadata: { phase },
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // UNIFIED: Always use /chat endpoint (backend handles memory automatically)
      // If doctor_id present → memory enabled
      // If no doctor_id → ephemeral mode (no memory)
      const response = await assistantAPI.chat({
        message: userMessage,
        context: { ...context, phase },
        conversationHistory: messages,
      });

      const fiMessage: FIMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(), // Generate timestamp client-side
        metadata: {
          tone: response.persona as FITone, // Map persona to tone (for UI styling)
          phase,
          id: `fi_${Date.now()}`,
        },
      };

      setMessages(prev => [...prev, fiMessage]);
      setIsTyping(false);
      setLoading(false);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      setIsTyping(false);
      setLoading(false);

      // Add error message to conversation
      const errorMsg: FIMessage = {
        role: 'assistant',
        content: `❌ Error: ${errorMessage}. Click "Retry" to try again.`,
        timestamp: new Date().toISOString(),
        metadata: {
          tone: 'neutral' as FITone, // Use neutral for error messages
          phase,
        },
      };
      setMessages(prev => [...prev, errorMsg]);

      return null;
    }
  }, [phase, context, messages]);

  /**
   * Retry last failed message
   */
  const retry = useCallback(async (): Promise<void> => {
    if (!lastMessageRef.current) {
      return;
    }

    // Remove last error message
    setMessages(prev => prev.slice(0, -1));

    // Retry with last message
    await sendMessage(lastMessageRef.current);
  }, [sendMessage]);

  /**
   * Clear conversation
   * SOLID: Dependency Inversion - use IMessageStorage interface
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setLoading(false);
    setIsTyping(false);
    lastMessageRef.current = null;

    if (storageKey) {
      storage.clear(storageKey);
    }
  }, [storageKey, storage]);

  /**
   * Load older messages from backend (for infinite scroll)
   * SOLID: Dependency Inversion - use IBackendSync interface
   */
  const loadOlderMessages = useCallback(async (): Promise<void> => {
    const doctorId = context?.doctor_id;

    if (loadingOlder || !hasMoreMessages || !doctorId) {
      return;
    }

    setLoadingOlder(true);

    try {
      // Load older messages (IBackendSync interface)
      const result = await backendSync.loadOlder(doctorId, phase, paginationOffset, 50);

      // Prepend older messages to the start of the array
      setMessages(prev => [...result.messages, ...prev]);

      // Update pagination state
      setPaginationOffset(prev => prev + result.messages.length);
      setHasMoreMessages(result.hasMore);
    } catch (err) {
      console.error('Failed to load older messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasMoreMessages, context?.doctor_id, paginationOffset, phase, backendSync]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    getIntroduction,
    clearConversation,
    retry,
    isTyping,
    loadingInitial,
    loadOlderMessages,
    hasMoreMessages,
    loadingOlder,
  };
}

/**
 * Hook for tracking emotional context (frustration, success, hesitation)
 * Used by FI-ONBOARD-005 (Emotional Intelligence System)
 *
 * @example
 * ```tsx
 * const { emotionalState } = useEmotionalContext();
 * // emotionalState: 'neutral' | 'frustrated' | 'successful' | 'hesitant'
 * ```
 */
export function useEmotionalContext() {
  // TODO: Implement in FI-ONBOARD-005
  return {
    emotionalState: 'neutral' as 'neutral' | 'frustrated' | 'successful' | 'hesitant',
  };
}
