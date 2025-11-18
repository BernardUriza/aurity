/**
 * useFIConversation Hook
 *
 * Card: FI-ONBOARD-001
 * React hook for managing Free-Intelligence conversation state
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { assistantAPI } from '@/lib/api/assistant';
import type {
  FIMessage,
  FIChatContext,
  FIChatResponse,
  OnboardingPhase,
} from '@/types/assistant';

/**
 * Hook options
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
  } = options;

  const [messages, setMessages] = useState<FIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const lastMessageRef = useRef<string | null>(null);
  const introductionLoadedRef = useRef(false);

  // Load messages from LocalStorage on mount
  useEffect(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setMessages(parsed);
        }
      } catch (err) {
        console.error('Failed to load conversation from LocalStorage:', err);
      }
    }
  }, [storageKey]);

  // Save messages to LocalStorage when they change
  useEffect(() => {
    if (storageKey && messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (err) {
        console.error('Failed to save conversation to LocalStorage:', err);
      }
    }
  }, [storageKey, messages]);

  // Auto-load introduction on mount
  useEffect(() => {
    if (autoIntroduction && !introductionLoadedRef.current && messages.length === 0) {
      introductionLoadedRef.current = true;
      getIntroduction();
    }
  }, [autoIntroduction, messages.length]);

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

      setMessages([fiMessage]);
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
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setLoading(false);
    setIsTyping(false);
    lastMessageRef.current = null;

    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (err) {
        console.error('Failed to clear conversation from LocalStorage:', err);
      }
    }
  }, [storageKey]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    getIntroduction,
    clearConversation,
    retry,
    isTyping,
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
