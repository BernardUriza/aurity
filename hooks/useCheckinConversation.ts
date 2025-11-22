/**
 * useCheckinConversation - Hook for FI Receptionist check-in flow
 *
 * Card: FI-CHECKIN-005
 * Connects to the conversational check-in backend endpoints:
 * - POST /api/checkin/conversation/start
 * - POST /api/checkin/conversation/{session_id}/message
 *
 * Unlike useFIConversation (general chat), this uses a state-machine
 * approach optimized for patient check-in flows with quick replies.
 */

import { useState, useCallback, useRef } from 'react';
import type { FIMessage } from '@/types/assistant';

// =============================================================================
// TYPES
// =============================================================================

export interface ConversationState {
  /** Current state in check-in flow */
  state:
    | 'greeting'
    | 'code_input'
    | 'code_verify'
    | 'name_input'
    | 'info_confirm'
    | 'pending_actions'
    | 'complete'
    | 'error'
    | 'human_escalation';
  /** Quick reply options for current state */
  quickReplies: string[];
  /** Actions to execute (e.g., complete_checkin) */
  actions: Array<{ type: string; [key: string]: unknown }>;
  /** Additional metadata from backend */
  metadata: Record<string, unknown>;
}

export interface UseCheckinConversationOptions {
  /** Clinic ID from QR code */
  clinicId: string;
  /** Optional clinic display name */
  clinicName?: string;
  /** Called when check-in is completed */
  onComplete?: (result: { appointmentId: string; patientId: string }) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

export interface UseCheckinConversationReturn {
  /** Chat messages */
  messages: FIMessage[];
  /** Current conversation state */
  conversationState: ConversationState | null;
  /** Loading state */
  loading: boolean;
  /** Is assistant "typing" */
  isTyping: boolean;
  /** Session ID */
  sessionId: string | null;
  /** Start the conversation */
  startConversation: () => Promise<void>;
  /** Send a message */
  sendMessage: (message: string) => Promise<void>;
  /** Send a quick reply */
  sendQuickReply: (reply: string) => Promise<void>;
  /** End the conversation */
  endConversation: () => Promise<void>;
}

// =============================================================================
// API CLIENT
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

interface StartConversationResponse {
  session_id: string;
  message: string;
  state: ConversationState['state'];
  quick_replies: string[];
}

interface SendMessageResponse {
  message: string;
  state: ConversationState['state'];
  requires_input: boolean;
  actions: Array<{ type: string; [key: string]: unknown }>;
  quick_replies: string[];
  metadata: Record<string, unknown>;
}

async function apiStartConversation(
  clinicId: string,
  clinicName?: string
): Promise<StartConversationResponse> {
  const response = await fetch(`${API_BASE}/api/checkin/conversation/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinic_id: clinicId,
      clinic_name: clinicName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start conversation: ${response.statusText}`);
  }

  return response.json();
}

async function apiSendMessage(
  sessionId: string,
  message: string
): Promise<SendMessageResponse> {
  const response = await fetch(
    `${API_BASE}/api/checkin/conversation/${sessionId}/message`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  return response.json();
}

async function apiEndConversation(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/api/checkin/conversation/${sessionId}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// HOOK
// =============================================================================

export function useCheckinConversation({
  clinicId,
  clinicName,
  onComplete,
  onError,
}: UseCheckinConversationOptions): UseCheckinConversationReturn {
  const [messages, setMessages] = useState<FIMessage[]>([]);
  const [conversationState, setConversationState] =
    useState<ConversationState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messageIdCounter = useRef(0);

  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg-${Date.now()}-${messageIdCounter.current}`;
  }, []);

  // Add message to state
  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string) => {
      const newMessage: FIMessage = {
        role,
        content,
        timestamp: new Date().toISOString(),
        metadata: {
          id: generateMessageId(),
        },
      };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    [generateMessageId]
  );

  // Start conversation
  const startConversation = useCallback(async () => {
    if (sessionId) return; // Already started

    setLoading(true);
    setIsTyping(true);

    try {
      const response = await apiStartConversation(clinicId, clinicName);

      setSessionId(response.session_id);
      setConversationState({
        state: response.state,
        quickReplies: response.quick_replies || [],
        actions: [],
        metadata: {},
      });

      // Add greeting message
      addMessage('assistant', response.message);
    } catch (error) {
      console.error('[useCheckinConversation] Start failed:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to start');
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }, [clinicId, clinicName, sessionId, addMessage, onError]);

  // Send message
  const sendMessage = useCallback(
    async (message: string) => {
      if (!sessionId || loading) return;

      // Add user message immediately
      addMessage('user', message);

      setLoading(true);
      setIsTyping(true);

      try {
        const response = await apiSendMessage(sessionId, message);

        // Update conversation state
        setConversationState({
          state: response.state,
          quickReplies: response.quick_replies || [],
          actions: response.actions || [],
          metadata: response.metadata || {},
        });

        // Add assistant response
        addMessage('assistant', response.message);

        // Check for completion
        if (response.state === 'complete') {
          const completeAction = response.actions?.find(
            (a) => a.type === 'complete_checkin'
          );
          if (completeAction && onComplete) {
            onComplete({
              appointmentId: completeAction.appointment_id as string,
              patientId: completeAction.patient_id as string,
            });
          }
        }
      } catch (error) {
        console.error('[useCheckinConversation] Send failed:', error);
        addMessage(
          'assistant',
          'Lo siento, hubo un error. Por favor intente de nuevo o solicite ayuda en recepción.'
        );
        onError?.(error instanceof Error ? error.message : 'Failed to send');
      } finally {
        setLoading(false);
        setIsTyping(false);
      }
    },
    [sessionId, loading, addMessage, onComplete, onError]
  );

  // Send quick reply (same as sendMessage but for buttons)
  const sendQuickReply = useCallback(
    async (reply: string) => {
      await sendMessage(reply);
    },
    [sendMessage]
  );

  // End conversation
  const endConversation = useCallback(async () => {
    if (!sessionId) return;

    try {
      await apiEndConversation(sessionId);
    } catch (error) {
      console.error('[useCheckinConversation] End failed:', error);
    } finally {
      setSessionId(null);
      setConversationState(null);
      setMessages([]);
    }
  }, [sessionId]);

  return {
    messages,
    conversationState,
    loading,
    isTyping,
    sessionId,
    startConversation,
    sendMessage,
    sendQuickReply,
    endConversation,
  };
}
