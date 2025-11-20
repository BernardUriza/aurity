/**
 * useAIPreset Hook
 *
 * Simple implementation of preset pattern with longitudinal memory.
 * NO agents, NO middleware - just preset loading and memory management.
 *
 * Inspired by redux-claude but simplified to demonstrate core concept.
 *
 * Usage:
 * ```tsx
 * const { systemPrompt, addMessage, messages, resetConversation } = useAIPreset('fi-medical-assistant');
 *
 * // When calling AI API:
 * const response = await fetch('/api/chat', {
 *   body: JSON.stringify({
 *     systemPrompt,           // From preset
 *     messages,               // Longitudinal memory
 *     userMessage: 'Hello'
 *   })
 * });
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { getPresetById, defaultPreset } from '@/config/ai-presets.config';
import type { AIPromptPreset } from '@/config/ai-presets.config';

/**
 * Message structure for conversation memory
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

/**
 * Persistent context (redux-like state)
 */
interface PersistentContext {
  [key: string]: unknown;
}

/**
 * Hook return type
 */
interface UseAIPresetReturn {
  /** Current preset configuration */
  preset: AIPromptPreset;

  /** System prompt for AI API calls */
  systemPrompt: string;

  /** Conversation history (longitudinal memory) */
  messages: ConversationMessage[];

  /** Add message to conversation */
  addMessage: (role: 'user' | 'assistant', content: string) => void;

  /** Clear conversation history */
  resetConversation: () => void;

  /** Persistent context (redux-like state) */
  context: PersistentContext;

  /** Update persistent context */
  updateContext: (key: string, value: unknown) => void;

  /** Get context value */
  getContext: (key: string) => unknown;
}

/**
 * useAIPreset Hook
 *
 * Load and manage AI conversation preset with memory.
 *
 * @param presetId - Preset identifier (default: 'fi-medical-assistant')
 * @returns Preset configuration and memory management functions
 */
export function useAIPreset(presetId?: string): UseAIPresetReturn {
  // Load preset (fallback to default if not found)
  const preset = presetId ? getPresetById(presetId) ?? defaultPreset : defaultPreset;

  // Conversation memory state
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  // Persistent context (redux-like state)
  const [context, setContext] = useState<PersistentContext>({});

  /**
   * LONGITUDINAL MEMORY: Load from localStorage on mount
   */
  useEffect(() => {
    if (!preset.memoryConfig.persistAcrossSessions) return;

    // Load conversation history
    const storageKey = `ai-preset-${preset.id}-messages`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      } catch (error) {
        console.warn('Failed to parse stored messages:', error);
      }
    }

    // Load persistent context
    if (preset.contextWindow) {
      const contextKey = preset.contextWindow.storageKey;
      const storedContext = localStorage.getItem(contextKey);
      if (storedContext) {
        try {
          const parsedContext = JSON.parse(storedContext);
          setContext(parsedContext);
        } catch (error) {
          console.warn('Failed to parse stored context:', error);
        }
      }
    }
  }, [preset.id, preset.memoryConfig.persistAcrossSessions, preset.contextWindow]);

  /**
   * Save to localStorage when messages change
   */
  useEffect(() => {
    if (!preset.memoryConfig.persistAcrossSessions) return;

    const storageKey = `ai-preset-${preset.id}-messages`;
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, preset.id, preset.memoryConfig.persistAcrossSessions]);

  /**
   * Save context to localStorage when it changes
   */
  useEffect(() => {
    if (!preset.contextWindow) return;

    const contextKey = preset.contextWindow.storageKey;
    localStorage.setItem(contextKey, JSON.stringify(context));
  }, [context, preset.contextWindow]);

  /**
   * Add message to conversation with memory management
   */
  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string) => {
      const newMessage: ConversationMessage = {
        role,
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, newMessage];

        // Apply retention policy
        const { maxMessages, retentionPolicy } = preset.memoryConfig;

        if (updated.length > maxMessages) {
          switch (retentionPolicy) {
            case 'sliding-window':
              // Keep only most recent messages
              return updated.slice(-maxMessages);

            case 'keep-all':
              // Keep everything (ignore maxMessages)
              return updated;

            case 'summarize-old':
              // TODO: In production, you'd call AI to summarize old messages
              // For now, just keep recent ones
              return updated.slice(-maxMessages);

            default:
              return updated.slice(-maxMessages);
          }
        }

        return updated;
      });
    },
    [preset.memoryConfig]
  );

  /**
   * Reset conversation history
   */
  const resetConversation = useCallback(() => {
    setMessages([]);
    const storageKey = `ai-preset-${preset.id}-messages`;
    localStorage.removeItem(storageKey);
  }, [preset.id]);

  /**
   * Update persistent context (redux-like dispatch)
   */
  const updateContext = useCallback((key: string, value: unknown) => {
    setContext((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Get context value
   */
  const getContext = useCallback(
    (key: string): unknown => {
      return context[key];
    },
    [context]
  );

  return {
    preset,
    systemPrompt: preset.systemPrompt,
    messages,
    addMessage,
    resetConversation,
    context,
    updateContext,
    getContext,
  };
}

/**
 * Example Usage Component
 *
 * This demonstrates how to use the preset hook in practice.
 * NOT for production - just for understanding the concept.
 */
export function ExampleUsage() {
  const {
    systemPrompt,
    messages,
    addMessage,
    context,
    updateContext,
  } = useAIPreset('fi-medical-assistant');

  // On component mount, set persistent context
  useEffect(() => {
    updateContext('user.name', 'Dr. Bernard Uriza');
    updateContext('user.specialty', 'Telemedicine');
    updateContext('corpus_path', '/storage/corpus.h5');
  }, [updateContext]);

  // Simulate sending message to AI
  const handleSendMessage = async (userMessage: string) => {
    // 1. Add user message to memory
    addMessage('user', userMessage);

    // 2. Call AI API with system prompt + memory + persistent context
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,           // From preset
        messages,               // Longitudinal memory
        context,                // Persistent context (redux-like state)
        userMessage,
      }),
    });

    const data = await response.json();

    // 3. Add assistant response to memory
    addMessage('assistant', data.response);
  };

  return null; // Example only
}
