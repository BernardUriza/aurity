"use client";

/**
 * Chat Page - AURITY Free Intelligence
 *
 * Standalone chat page - anyone can use it!
 * - If authenticated → memory enabled (infinite conversation)
 * - If anonymous → ephemeral mode (localStorage only, no backend)
 */

import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useFIConversation } from '@/hooks/useFIConversation';
import { AurityBanner } from '@/components/layout/AurityBanner';
import type { ChatViewMode } from '@/components/chat/ChatWidgetContainer';
import { ChatWidgetHeader } from '@/components/chat/ChatWidgetHeader';
import { ChatWidgetMessages } from '@/components/chat/ChatWidgetMessages';
import { ChatWidgetInput } from '@/components/chat/ChatWidgetInput';
import { ChatToolbar, type ResponseMode } from '@/components/chat/ChatToolbar';
import { ScrollToBottomButton } from '@/components/chat/ChatUtilities';
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
    inputPlaceholder: 'Escribe tu mensaje... (presiona Enter para enviar)',
  },
});

export default function ChatPage() {
  const { user } = useAuth0();
  const [message, setMessage] = useState('');
  const [viewMode] = useState<ChatViewMode>('fullscreen');
  const [responseMode, setResponseMode] = useState<ResponseMode>('explanatory');

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
  } = useFIConversation({
    phase: undefined,
    context: {
      doctor_id: user?.sub,  // If authenticated → memory enabled
      doctor_name: user?.name,
      response_mode: responseMode,
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

  // Load response mode preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('fi_response_mode') as ResponseMode | null;
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
        />

        {/* Scroll to bottom */}
        <ScrollToBottomButton containerId="chat-widget-messages" />

        {/* Toolbar */}
        <ChatToolbar
          responseMode={responseMode}
          showAttach={false}
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
          placeholder={chatConfig.behavior.inputPlaceholder}
          footer={chatConfig.footer}
          onMessageChange={setMessage}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
