"use client";

/**
 * ChatWidget - Floating Chat with Free Intelligence
 *
 * Clean, modular chat widget with multiple view modes.
 * Features:
 * - Normal, Fullscreen, and Minimized modes
 * - Smart timestamps with tooltips
 * - Message grouping with day dividers
 * - Configurable themes and behavior
 * - Infinite memory with Auth0 integration
 *
 * Architecture:
 *   ChatWidget → useFIConversation → assistantAPI → /assistant/chat → /internal/llm/chat
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { MessageCircle } from 'lucide-react';
import { useFIConversation } from '@/hooks/useFIConversation';
import { useChatVoiceRecorder } from '@/hooks/useChatVoiceRecorder';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import { ChatWidgetContainer, type ChatViewMode } from './ChatWidgetContainer';
import { ChatWidgetHeader } from './ChatWidgetHeader';
import { ChatWidgetMessages } from './ChatWidgetMessages';
import { ChatWidgetInput } from './ChatWidgetInput';
import { ChatToolbar, type ResponseMode, type PersonaType } from './ChatToolbar';
import { HistorySearch } from './HistorySearch';
import { ChatStartScreen } from './ChatStartScreen';
import { defaultChatConfig, type ChatConfig, CHAT_BREAKPOINTS } from '@/config/chat.config';

export interface ChatWidgetProps {
  /** Custom configuration (optional) */
  config?: Partial<ChatConfig>;
}

export function ChatWidget({ config: customConfig }: ChatWidgetProps = {}) {
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();

  // Detect device breakpoints for responsive behavior
  const { isMobile, isTablet, isDesktop } = useBreakpoints(CHAT_BREAKPOINTS, {
    ssrMatch: false,
  });

  // View state
  const [viewMode, setViewMode] = useState<ChatViewMode>('normal');
  const [isOpen, setIsOpen] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [message, setMessage] = useState('');
  const [responseMode, setResponseMode] = useState<ResponseMode>('explanatory');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('general_assistant');
  const [showHistorySearch, setShowHistorySearch] = useState(false);

  // Merge custom config with defaults
  const config: ChatConfig = {
    ...defaultChatConfig,
    ...customConfig,
    theme: { ...defaultChatConfig.theme, ...customConfig?.theme },
    behavior: { ...defaultChatConfig.behavior, ...customConfig?.behavior },
    timestamp: { ...defaultChatConfig.timestamp, ...customConfig?.timestamp },
    animation: { ...defaultChatConfig.animation, ...customConfig?.animation },
  };

  // Use conversation hook with doctor_id from Auth0
  // Generate user-specific storage key to isolate conversation history per authenticated user
  // For anonymous users: use sessionStorage key to make it truly ephemeral
  const storageKey = user?.sub
    ? `fi_chat_widget_${user.sub}`  // Authenticated: persistent across sessions
    : undefined;  // Anonymous: NO persistence (ephemeral mode)

  const {
    messages,
    loading,
    isTyping,
    loadingInitial,
    sendMessage,
    getIntroduction,
    loadOlderMessages,
    hasMoreMessages,
    loadingOlder,
    clearConversation,
  } = useFIConversation({
    phase: undefined, // No specific phase for general chat widget
    context: {
      doctor_id: user?.sub, // Auth0 user.sub as doctor_id
      doctor_name: user?.name,
      response_mode: responseMode, // Pass response mode to backend
      persona: selectedPersona, // Pass selected persona to backend
    },
    storageKey,
    autoIntroduction: false, // Don't auto-introduce, wait for user to open
  });

  // Handle send message
  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage(''); // Clear input immediately

    await sendMessage(userMessage);
  };

  // Handle opening widget - just opens UI, does NOT call LLM
  const handleOpen = () => {
    setIsOpen(true);
    // If user has existing messages, they already started a conversation
    if (messages.length > 0) {
      setConversationStarted(true);
    }
  };

  // Handle explicit conversation start (user clicks "Comenzar")
  const handleStartConversation = async () => {
    if (!isAuthenticated) return;

    setIsStartingConversation(true);
    try {
      await getIntroduction();
      setConversationStarted(true);
    } finally {
      setIsStartingConversation(false);
    }
  };

  // Handle login redirect
  const handleLogin = () => {
    loginWithRedirect({
      appState: { returnTo: window.location.pathname },
    });
  };

  // Handle view mode changes
  const handleModeChange = (mode: ChatViewMode) => {
    setViewMode(mode);
  };

  const handleMinimize = () => {
    // Only works in expanded mode: restore to normal
    if (viewMode === 'expanded') {
      setViewMode('normal');
    }
  };
  const handleMaximize = () => setViewMode(viewMode === 'expanded' ? 'normal' : 'expanded');
  const handleClose = () => {
    // Close completely to floating button
    setIsOpen(false);
    setViewMode('normal'); // Reset to normal for next open
  };

  // Toolbar handlers
  const handleResponseModeToggle = () => {
    const newMode: ResponseMode = responseMode === 'explanatory' ? 'concise' : 'explanatory';
    setResponseMode(newMode);
    // Persist response mode preference
    localStorage.setItem('fi_response_mode', newMode);
  };

  // Handle persona change: keep conversation history, change behavior on next message
  const handlePersonaChange = (newPersona: PersonaType) => {
    if (newPersona === selectedPersona) return; // No change

    console.log(`[ChatWidget] Persona changing: ${selectedPersona} → ${newPersona}`);

    // Update persona state
    setSelectedPersona(newPersona);

    // Persist persona preference
    localStorage.setItem('fi_persona', newPersona);

    // Next AI message will automatically use the new persona
    // (context.persona is passed to backend on every request)
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

  // Capture message before recording (for append behavior)
  const messageBeforeRecordingRef = useRef('');

  // Voice recording with useChatVoiceRecorder hook
  const {
    isRecording: isVoiceRecording,
    recordingTime,
    audioLevel,
    isSilent,
    isTranscribing,
    startRecording: startVoiceRecording,
    stopRecording: stopVoiceRecording,
  } = useChatVoiceRecorder({
    userId: user?.sub || 'anonymous',
    onTranscriptUpdate: (transcript) => {
      console.log('[ChatWidget] Live transcript:', transcript);
      // Append to existing message (captured before recording started)
      const combined = messageBeforeRecordingRef.current
        ? `${messageBeforeRecordingRef.current} ${transcript}`.trim()
        : transcript;
      setMessage(combined);
    },
    onError: (error) => {
      console.error('[ChatWidget] Voice error:', error);
    },
  });

  const voiceRecordingState = useMemo(() => ({
    isRecording: isVoiceRecording,
    isTranscribing,
    audioLevel,
    isSilent,
    recordingTime,
  }), [isVoiceRecording, isTranscribing, audioLevel, isSilent, recordingTime]);

  // Voice handlers
  const handleVoiceStart = async () => {
    console.log('[ChatWidget] handleVoiceStart called');
    // Capture current message before starting recording
    messageBeforeRecordingRef.current = message;
    await startVoiceRecording();
  };

  const handleVoiceStop = async () => {
    console.log('[ChatWidget] handleVoiceStop called');
    const finalTranscript = await stopVoiceRecording();
    console.log('[ChatWidget] Final transcript:', finalTranscript);
    // Transcript already in message state via onTranscriptUpdate
  };

  // ========================================================================
  // FLOATING BUTTON (when closed) - Responsive sizing
  // ========================================================================
  if (!isOpen) {
    // Compute responsive button size
    const buttonSize = isMobile ? 'w-16 h-16' : 'w-14 h-14';
    const iconSize = isMobile ? 'h-7 w-7' : 'h-6 w-6';
    const buttonPosition = isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6';

    return (
      <button
        onClick={handleOpen}
        className={`
          fixed ${buttonPosition}
          ${buttonSize}
          bg-gradient-to-br from-purple-600 to-blue-600
          hover:from-purple-700 hover:to-blue-700
          rounded-full shadow-2xl
          hover:shadow-purple-500/50
          transition-all duration-300
          hover:scale-110
          z-50
          flex items-center justify-center
          group
        `}
        aria-label="Chat with Free Intelligence"
      >
        <MessageCircle className={`${iconSize} text-white`} />

        {/* Notification badge */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />

        {/* Tooltip (hide on mobile) */}
        {!isMobile && (
          <div className="
            absolute bottom-full right-0 mb-2
            px-3 py-1.5
            bg-slate-800 text-white text-sm
            rounded-lg
            opacity-0 group-hover:opacity-100
            transition-opacity
            whitespace-nowrap
          ">
            Habla con Free Intelligence
          </div>
        )}
      </button>
    );
  }

  // ========================================================================
  // CHAT WIDGET (open)
  // ========================================================================

  // Show start screen if conversation hasn't been explicitly started
  const showStartScreen = !conversationStarted && messages.length === 0;

  return (
    <ChatWidgetContainer
      mode={viewMode}
      title={config.title}
      onModeChange={handleModeChange}
    >
      {/* Header */}
      <ChatWidgetHeader
        title={config.title}
        subtitle={config.subtitle}
        backgroundClass={config.theme.background.header}
        mode={viewMode}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
        onHistorySearch={() => setShowHistorySearch(true)}
      />

      {/* Start Screen - shown before conversation begins */}
      {showStartScreen ? (
        <ChatStartScreen
          isAuthenticated={isAuthenticated}
          userName={user?.name}
          onStart={handleStartConversation}
          onLogin={handleLogin}
          isLoading={isStartingConversation}
        />
      ) : (
        <>
          {/* Messages */}
          <ChatWidgetMessages
            messages={messages}
            isTyping={isTyping}
            loadingInitial={loadingInitial}
            config={config}
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
            showLanguage={false}
            showFormatting={false}
            onResponseModeToggle={handleResponseModeToggle}
            onPersonaChange={handlePersonaChange}
            onVoiceStart={handleVoiceStart}
            onVoiceStop={handleVoiceStop}
          />

          {/* Input */}
          <ChatWidgetInput
            message={message}
            loading={loading}
            placeholder={config.behavior.inputPlaceholder}
            footer={config.footer}
            onMessageChange={setMessage}
            onSend={handleSend}
          />
        </>
      )}

      {/* History Search Modal */}
      {showHistorySearch && (
        <HistorySearch
          mode="modal"
          onClose={() => setShowHistorySearch(false)}
          onSelectResult={(result) => {
            console.log('Selected history result:', result);
            // TODO: Jump to conversation or show in context
            setShowHistorySearch(false);
          }}
        />
      )}
    </ChatWidgetContainer>
  );
}
