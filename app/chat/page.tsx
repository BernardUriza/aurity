"use client";

/**
 * Chat Page - AURITY Free Intelligence
 *
 * Standalone chat page - anyone can use it!
 * - If authenticated → memory enabled (infinite conversation)
 * - If anonymous → ephemeral mode (localStorage only, no backend)
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useFIConversation } from '@/hooks/useFIConversation';
import { useChatVoiceRecorder } from '@/hooks/useChatVoiceRecorder';
import { AurityBanner } from '@/components/layout/AurityBanner';
import type { ChatViewMode } from '@/components/chat/ChatWidgetContainer';
import { ChatWidgetHeader } from '@/components/chat/ChatWidgetHeader';
import { ChatWidgetMessages } from '@/components/chat/ChatWidgetMessages';
import { ChatWidgetInput } from '@/components/chat/ChatWidgetInput';
import { ChatToolbar, type ResponseMode, type PersonaType } from '@/components/chat/ChatToolbar';
import { defaultChatConfig, type ChatConfig } from '@/config/chat.config';

/**
 * Chat Configuration (adaptive based on auth state)
 */
const getChatConfig = (isAuthenticated: boolean): ChatConfig => ({
  ...defaultChatConfig,
  title: 'Free Intelligence',
  subtitle: isAuthenticated
    ? 'Chat con memoria infinita'
    : 'Chat · Sin registro requerido',
  footer: isAuthenticated
    ? 'Conversación guardada permanentemente'
    : 'Conversación efímera · Solo en este navegador',
  dimensions: {
    width: '100%',
    height: '100vh',
    minHeight: '100vh',
    maxHeight: '100vh',
  },
  behavior: {
    ...defaultChatConfig.behavior,
    inputPlaceholder: 'Escribe... (presiona Enter para enviar)',
  },
});

export default function ChatPage() {
  const { user } = useAuth0();
  const [message, setMessage] = useState('');
  const [viewMode] = useState<ChatViewMode>('fullscreen');
  const [responseMode, setResponseMode] = useState<ResponseMode>('explanatory');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('general_assistant');

  // Capture message before recording (for append behavior)
  const messageBeforeRecordingRef = useRef('');

  // Voice recording with useChatVoiceRecorder hook
  const {
    isRecording: isVoiceRecording,
    recordingTime,
    audioLevel,
    isSilent,
    liveTranscript,
    isTranscribing,
    startRecording: startVoiceRecording,
    stopRecording: stopVoiceRecording,
  } = useChatVoiceRecorder({
    userId: user?.sub || 'anonymous',
    onTranscriptUpdate: (transcript) => {
      console.log('[ChatPage] Live transcript:', transcript);
      // Append to existing message (captured before recording started)
      const combined = messageBeforeRecordingRef.current
        ? `${messageBeforeRecordingRef.current} ${transcript}`.trim()
        : transcript;
      setMessage(combined);
    },
    onError: (error) => {
      console.error('[ChatPage] Voice error:', error);
    },
  });

  const voiceRecordingState = useMemo(() => ({
    isRecording: isVoiceRecording,
    isTranscribing,
    audioLevel,
    isSilent,
    recordingTime,
  }), [isVoiceRecording, isTranscribing, audioLevel, isSilent, recordingTime]);

  // Adaptive: use doctor_id if authenticated, ephemeral if not
  const storageKey = user?.sub
    ? `fi_chat_${user.sub}`
    : 'fi_chat_anonymous';

  const chatConfig = getChatConfig(!!user);

  const {
    messages,
    loading,
    isTyping,
    loadingInitial,
    sendMessage: sendMessageHook,
    getIntroduction,
    clearConversation,
    loadOlderMessages,
    hasMoreMessages,
    loadingOlder,
  } = useFIConversation({
    phase: undefined,
    context: {
      doctor_id: user?.sub,  // If authenticated → memory enabled
      doctor_name: user?.name,
      response_mode: responseMode,
      persona: selectedPersona,  // Pass selected persona to backend
    },
    storageKey,  // Persistent localStorage (anonymous or user-specific)
    autoIntroduction: true,
  });

  // Handle send message
  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage(''); // Clear input immediately

    await sendMessageHook(userMessage);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Toolbar handlers
  const handleResponseModeToggle = () => {
    const newMode: ResponseMode = responseMode === 'explanatory' ? 'concise' : 'explanatory';
    setResponseMode(newMode);
    localStorage.setItem('fi_response_mode', newMode);
  };

  // Handle persona change: keep conversation history, change behavior on next message
  const handlePersonaChange = (newPersona: PersonaType) => {
    if (newPersona === selectedPersona) return; // No change

    console.log(`[ChatPage] Persona changing: ${selectedPersona} → ${newPersona}`);

    // Update persona state
    setSelectedPersona(newPersona);

    // Persist persona preference
    localStorage.setItem('fi_persona', newPersona);

    // Next AI message will automatically use the new persona
    // (context.persona is passed to backend on every request)
  };

  // Voice handlers
  const handleVoiceStart = async () => {
    console.log('[ChatPage] handleVoiceStart called');
    // Capture current message before starting recording
    messageBeforeRecordingRef.current = message;
    await startVoiceRecording();
  };

  const handleVoiceStop = async () => {
    console.log('[ChatPage] handleVoiceStop called');
    const finalTranscript = await stopVoiceRecording();
    console.log('[ChatPage] Final transcript:', finalTranscript);
    // Transcript already in message state via onTranscriptUpdate
  };

  // Load response mode preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('fi_response_mode') as ResponseMode | null;
    if (savedMode) {
      setResponseMode(savedMode);
    }
  }, []);

  // Load persona preference on mount
  useEffect(() => {
    const savedPersona = localStorage.getItem('fi_persona') as PersonaType | null;
    if (savedPersona) {
      setSelectedPersona(savedPersona);
    }
  }, []);

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden">
      {/* Compact AURITY banner */}
      <AurityBanner />

      {/* Chat container - custom layout without wrapper */}
      <div className="flex-1 w-full flex flex-col overflow-hidden">
        {/* Header */}
        <ChatWidgetHeader
          title={chatConfig.title}
          subtitle={chatConfig.subtitle}
          backgroundClass={chatConfig.theme.background.header}
          mode={viewMode}
          showControls={false}
          onMinimize={() => {}}
          onMaximize={() => {}}
          onClose={() => {}}
        />

        {/* Messages */}
        <ChatWidgetMessages
          messages={messages}
          isTyping={isTyping}
          loadingInitial={loadingInitial}
          config={chatConfig}
          userName={user?.name?.split(' ')[0]}
          mode={viewMode}
          onLoadOlder={loadOlderMessages}
          loadingOlder={loadingOlder}
          hasMoreMessages={hasMoreMessages}
        />

        {/* Toolbar */}
        <ChatToolbar
          responseMode={responseMode}
          selectedPersona={selectedPersona}
          voiceRecording={voiceRecordingState}
          showAttach={false}
          showLanguage={true}
          showFormatting={true}
          showResponseMode={true}
          showVoice={true}
          showPersonaSelector={true}
          onResponseModeToggle={handleResponseModeToggle}
          onPersonaChange={handlePersonaChange}
          onVoiceStart={handleVoiceStart}
          onVoiceStop={handleVoiceStop}
        />

        {/* Input */}
        <ChatWidgetInput
          message={message}
          loading={loading}
          placeholder={chatConfig.behavior.inputPlaceholder}
          footer={chatConfig.footer}
          onMessageChange={setMessage}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
