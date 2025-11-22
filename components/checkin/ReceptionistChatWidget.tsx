/**
 * ReceptionistChatWidget - FI Receptionist Chat Interface
 *
 * Card: FI-CHECKIN-005
 * Conversational check-in widget using the state-machine backend
 *
 * Uses:
 * - useCheckinConversation hook for backend communication
 * - receptionistChatConfig for styling
 * - Quick replies from backend conversation state
 */

'use client';

import { useState, useEffect } from 'react';
import { useCheckinConversation } from '@/hooks/useCheckinConversation';
import { ChatWidgetHeader } from '@/components/chat/ChatWidgetHeader';
import { ChatWidgetMessages } from '@/components/chat/ChatWidgetMessages';
import { ChatWidgetInput } from '@/components/chat/ChatWidgetInput';
import { ScrollToBottomButton } from '@/components/chat/ChatUtilities';
import { receptionistChatConfig } from '@/config/chat.config';
import {
  receptionistEmptyStateConfig,
  receptionistQuickActions,
} from '@/config/chat-messages.config';

// =============================================================================
// TYPES
// =============================================================================

export interface ReceptionistChatWidgetProps {
  /** Clinic ID from QR code */
  clinicId: string;
  /** Optional clinic display name */
  clinicName?: string;
  /** Optional pre-filled patient name */
  patientName?: string;
  /** Called when check-in is successfully completed */
  onCheckinComplete?: (result: CheckinResult) => void;
}

export interface CheckinResult {
  patientId: string;
  appointmentId: string;
  queuePosition?: number;
  estimatedWaitMinutes?: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ReceptionistChatWidget({
  clinicId,
  clinicName,
  patientName,
  onCheckinComplete,
}: ReceptionistChatWidgetProps) {
  const [message, setMessage] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  // Use the check-in specific conversation hook
  const {
    messages,
    conversationState,
    loading,
    isTyping,
    sessionId,
    startConversation,
    sendMessage,
    sendQuickReply,
  } = useCheckinConversation({
    clinicId,
    clinicName: clinicName || 'la clínica',
    onComplete: (result) => {
      onCheckinComplete?.({
        patientId: result.patientId,
        appointmentId: result.appointmentId,
      });
    },
    onError: (error) => {
      console.error('[ReceptionistChatWidget] Error:', error);
    },
  });

  // Handle send message
  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage(''); // Clear input immediately

    // Start conversation if not started
    if (!hasStarted) {
      setHasStarted(true);
      await startConversation();
      // Then send the message
      await sendMessage(userMessage);
    } else {
      await sendMessage(userMessage);
    }
  };

  // Handle quick action click (from empty state)
  const handleQuickAction = async (actionMessage: string) => {
    if (loading) return;

    setHasStarted(true);
    await startConversation();
    // Wait a bit for the greeting, then send the action
    setTimeout(() => {
      sendMessage(actionMessage);
    }, 500);
  };

  // Handle quick reply click (from backend state)
  const handleQuickReply = async (reply: string) => {
    if (loading) return;
    await sendQuickReply(reply);
  };

  // Config for this widget
  const config = receptionistChatConfig;

  // Show empty state before conversation starts
  const showEmptyState = !hasStarted && messages.length === 0;

  // Get quick replies from backend state
  const quickReplies = conversationState?.quickReplies || [];

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <ChatWidgetHeader
        title={config.title}
        subtitle={config.subtitle}
        backgroundClass={config.theme.background.header}
        mode="fullscreen"
        onClose={() => {
          if (window.opener) {
            window.close();
          }
        }}
        showControls={false}
      />

      {/* Empty State with Quick Actions */}
      {showEmptyState && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <span className="text-5xl mb-4 block">
              {receptionistEmptyStateConfig.emoji}
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">
              {receptionistEmptyStateConfig.welcomeTitle(patientName)}
            </h2>
            <p className="text-slate-400">
              {receptionistEmptyStateConfig.welcomeSubtitle}
            </p>
          </div>

          {/* Features List */}
          <div className="w-full max-w-sm space-y-2 mb-8">
            {receptionistEmptyStateConfig.features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-lg"
              >
                <span className="text-indigo-400">{feature.icon}</span>
                <span className="text-sm text-slate-300">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions Grid */}
          <div className="w-full max-w-sm">
            <p className="text-xs text-slate-500 text-center mb-3">
              Selecciona una opción o escribe tu mensaje
            </p>
            <div className="grid grid-cols-2 gap-3">
              {receptionistQuickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.message)}
                  disabled={loading}
                  className="flex flex-col items-center gap-2 px-4 py-4 bg-indigo-950/30 hover:bg-indigo-950/50 border border-indigo-600/30 hover:border-indigo-600/50 rounded-xl transition-all disabled:opacity-50"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-sm text-slate-300 text-center">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages (when conversation started) */}
      {!showEmptyState && (
        <>
          <ChatWidgetMessages
            messages={messages}
            isTyping={isTyping}
            loadingInitial={false}
            config={config}
            userName={patientName?.split(' ')[0]}
            mode="fullscreen"
          />

          {/* Quick Replies from Backend */}
          {quickReplies.length > 0 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 justify-center">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(reply)}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-sm rounded-full transition-all disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Scroll to bottom */}
          <ScrollToBottomButton containerId="chat-widget-messages" />
        </>
      )}

      {/* Input */}
      <ChatWidgetInput
        message={message}
        loading={loading}
        placeholder={config.behavior.inputPlaceholder}
        footer={config.footer}
        onMessageChange={setMessage}
        onSend={handleSend}
      />
    </div>
  );
}
