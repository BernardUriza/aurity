"use client";

/**
 * Public Chat Page - AURITY Free Intelligence
 *
 * Standalone public chat page using ChatWidget internals.
 * Bypasses the floating widget wrapper to show chat directly.
 */

import { useState, useEffect, useRef } from 'react';
import { useFIConversation } from '@/hooks/useFIConversation';
import { AurityBanner } from '@/components/AurityBanner';
import type { ChatViewMode } from '@/components/chat/ChatWidgetContainer';
import { ChatWidgetHeader } from '@/components/chat/ChatWidgetHeader';
import { ChatWidgetMessages } from '@/components/chat/ChatWidgetMessages';
import { ChatWidgetInput } from '@/components/chat/ChatWidgetInput';
import { ChatToolbar, type ResponseMode } from '@/components/chat/ChatToolbar';
import { ScrollToBottomButton } from '@/components/chat/ChatUtilities';
import { defaultChatConfig, type ChatConfig } from '@/config/chat.config';

/**
 * Public Chat Configuration
 */
const publicChatConfig: ChatConfig = {
  ...defaultChatConfig,
  title: 'Free Intelligence',
  subtitle: 'Chat público · Sin registro requerido',
  footer: 'Conversación efímera · Rate-limited (20 req/min)',
  dimensions: {
    width: '100%',
    height: '100vh',
    minHeight: '100vh',
    maxHeight: '100vh',
  },
  behavior: {
    ...defaultChatConfig.behavior,
    inputPlaceholder: 'Escribe tu mensaje... (presiona Enter para enviar)',
  },
};

export default function PublicChatPage() {
  const [message, setMessage] = useState('');
  const [viewMode] = useState<ChatViewMode>('fullscreen');
  const [responseMode, setResponseMode] = useState<ResponseMode>('explanatory');

  // Use conversation hook WITHOUT doctor_id → auto-detects public mode
  const {
    messages,
    loading,
    isTyping,
    sendMessage: sendMessageHook,
  } = useFIConversation({
    phase: undefined, // No specific phase for public chat
    context: {
      response_mode: responseMode, // Pass response mode to backend
    }, // NO doctor_id → triggers public-chat endpoint
    storageKey: 'fi_public_chat',
    autoIntroduction: true, // Auto-load introduction
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
    localStorage.setItem('fi_public_response_mode', newMode);
  };

  // Load response mode preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('fi_public_response_mode') as ResponseMode | null;
    if (savedMode) {
      setResponseMode(savedMode);
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
          title={publicChatConfig.title}
          subtitle={publicChatConfig.subtitle}
          backgroundClass={publicChatConfig.theme.background.header}
          mode={viewMode}
          showControls={false} // Hide control buttons in public mode
          onMinimize={() => {}} // Disabled
          onMaximize={() => {}} // Disabled
          onClose={() => {}} // Disabled
        />

        {/* Messages */}
        <ChatWidgetMessages
          messages={messages}
          isTyping={isTyping}
          config={publicChatConfig}
          userName={undefined} // No user name in public mode
          mode={viewMode}
        />

        {/* Scroll to bottom */}
        <ScrollToBottomButton containerId="chat-widget-messages" />

        {/* Toolbar */}
        <ChatToolbar
          responseMode={responseMode}
          showAttach={false} // Disabled in public mode
          showLanguage={true}
          showFormatting={true}
          showResponseMode={true}
          showVoice={true}
          onResponseModeToggle={handleResponseModeToggle}
        />

        {/* Input */}
        <ChatWidgetInput
          message={message}
          loading={loading}
          placeholder={publicChatConfig.behavior.inputPlaceholder}
          footer={publicChatConfig.footer}
          onMessageChange={setMessage}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
