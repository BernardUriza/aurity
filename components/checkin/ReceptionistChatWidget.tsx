/**
 * ReceptionistChatWidget - FI Receptionist Chat Interface
 *
 * Card: FI-CHECKIN-005
 * Wrapper around ChatWidget configured for patient check-in flow
 *
 * Uses:
 * - receptionistChatConfig from config/chat.config.ts
 * - receptionistEmptyStateConfig from config/chat-messages.config.ts
 * - fi_receptionist persona style
 */

'use client';

import { useState, useMemo } from 'react';
import { useFIConversation } from '@/hooks/useFIConversation';
import { ChatWidgetContainer } from '@/components/chat/ChatWidgetContainer';
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
  /** Optional pre-filled patient name */
  patientName?: string;
  /** Called when check-in is successfully completed */
  onCheckinComplete?: (result: CheckinResult) => void;
}

export interface CheckinResult {
  patientId: string;
  appointmentId: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ReceptionistChatWidget({
  clinicId,
  patientName,
  onCheckinComplete,
}: ReceptionistChatWidgetProps) {
  const [message, setMessage] = useState('');

  // Ephemeral storage for check-in session (no persistence needed)
  const sessionStorageKey = `fi_receptionist_${clinicId}_${Date.now()}`;

  // Use FI conversation hook with receptionist persona
  const {
    messages,
    loading,
    isTyping,
    loadingInitial,
    sendMessage,
    getIntroduction,
  } = useFIConversation({
    phase: undefined,
    context: {
      clinic_id: clinicId,
      patient_name: patientName,
      persona: 'fi_receptionist',
      response_mode: 'concise', // Short responses for check-in
    },
    storageKey: undefined, // Ephemeral - no persistence
    autoIntroduction: true, // Auto-greet the patient
  });

  // Handle send message
  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage(''); // Clear input immediately

    await sendMessage(userMessage);
  };

  // Handle quick action click
  const handleQuickAction = async (actionMessage: string) => {
    if (loading) return;
    await sendMessage(actionMessage);
  };

  // Config for this widget
  const config = receptionistChatConfig;

  // Show empty state with quick actions if no messages yet
  const showEmptyState = messages.length === 0 && !loadingInitial && !isTyping;

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <ChatWidgetHeader
        title={config.title}
        subtitle={config.subtitle}
        backgroundClass={config.theme.background.header}
        mode="fullscreen"
        onClose={() => {
          // Could trigger exit flow
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
            loadingInitial={loadingInitial}
            config={config}
            userName={patientName?.split(' ')[0]}
            mode="fullscreen"
          />

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
