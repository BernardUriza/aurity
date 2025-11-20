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

import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { MessageCircle } from 'lucide-react';
import { useFIConversation } from '@/hooks/useFIConversation';
import { ChatWidgetContainer, type ChatViewMode } from './ChatWidgetContainer';
import { ChatWidgetHeader } from './ChatWidgetHeader';
import { ChatWidgetMessages } from './ChatWidgetMessages';
import { ChatWidgetInput } from './ChatWidgetInput';
import { ChatToolbar, type ResponseMode } from './ChatToolbar';
import { ScrollToBottomButton } from './ChatUtilities';
import { HistorySearch } from './HistorySearch';
import { defaultChatConfig, type ChatConfig } from '@/config/chat.config';

export interface ChatWidgetProps {
  /** Custom configuration (optional) */
  config?: Partial<ChatConfig>;
}

export function ChatWidget({ config: customConfig }: ChatWidgetProps = {}) {
  const { user } = useAuth0();

  // View state
  const [viewMode, setViewMode] = useState<ChatViewMode>('normal');
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [responseMode, setResponseMode] = useState<ResponseMode>('explanatory');
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
  } = useFIConversation({
    phase: undefined, // No specific phase for general chat widget
    context: {
      doctor_id: user?.sub, // Auth0 user.sub as doctor_id
      doctor_name: user?.name,
      response_mode: responseMode, // Pass response mode to backend
    },
    storageKey,
    autoIntroduction: false, // Don't auto-introduce, wait for user to open
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && config.behavior.autoScroll) {
      const chatContainer = document.getElementById('chat-widget-messages');
      if (chatContainer) {
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: config.animation.scroll.behavior,
        });
      }
    }
  }, [messages, isOpen, config.behavior.autoScroll, config.animation.scroll.behavior]);

  // Handle send message
  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage(''); // Clear input immediately

    await sendMessage(userMessage);
  };

  // Handle opening widget
  const handleOpen = async () => {
    setIsOpen(true);
    if (messages.length === 0) {
      await getIntroduction();
    }
  };

  // Handle view mode changes
  const handleModeChange = (mode: ChatViewMode) => {
    setViewMode(mode);
  };

  const handleMinimize = () => setViewMode('minimized');
  const handleMaximize = () => setViewMode(viewMode === 'expanded' ? 'normal' : 'expanded');
  const handleClose = () => setIsOpen(false);

  // Toolbar handlers
  const handleAttach = () => {
    console.log('Attach file clicked');
    // TODO: Implement file attachment
  };

  const handleLanguage = () => {
    console.log('Language clicked');
    // TODO: Implement language selection
  };

  const handleFormatting = () => {
    console.log('Formatting clicked');
    // TODO: Implement text formatting
  };

  const handleResponseModeToggle = () => {
    const newMode: ResponseMode = responseMode === 'explanatory' ? 'concise' : 'explanatory';
    setResponseMode(newMode);
    // Persist response mode preference
    localStorage.setItem('fi_response_mode', newMode);
  };

  // Load response mode preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('fi_response_mode') as ResponseMode | null;
    if (savedMode) {
      setResponseMode(savedMode);
    }
  }, []);

  const handleVoice = () => {
    console.log('Voice input clicked');
    // TODO: Implement voice input
  };

  // ========================================================================
  // FLOATING BUTTON (when closed)
  // ========================================================================
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="
          fixed bottom-6 right-6
          w-14 h-14
          bg-gradient-to-br from-purple-600 to-blue-600
          hover:from-purple-700 hover:to-blue-700
          rounded-full shadow-2xl
          hover:shadow-purple-500/50
          transition-all duration-300
          hover:scale-110
          z-50
          flex items-center justify-center
          group
        "
        aria-label="Chat with Free Intelligence"
      >
        <MessageCircle className="h-6 w-6 text-white" />

        {/* Notification badge */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />

        {/* Tooltip */}
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
      </button>
    );
  }

  // ========================================================================
  // CHAT WIDGET (open)
  // ========================================================================
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

      {/* Scroll to bottom */}
      <ScrollToBottomButton containerId="chat-widget-messages" />

      {/* Toolbar */}
      <ChatToolbar
        responseMode={responseMode}
        onAttach={handleAttach}
        onLanguage={handleLanguage}
        onFormatting={handleFormatting}
        onResponseModeToggle={handleResponseModeToggle}
        onVoice={handleVoice}
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
