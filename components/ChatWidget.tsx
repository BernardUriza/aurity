"use client";

/**
 * ChatWidget - Floating Chat with Free Intelligence
 *
 * Omnipresent chat widget accessible from any page.
 * Uses Auth0 user.sub as doctor_id for personalized infinite memory.
 *
 * Architecture:
 *   ChatWidget → useFIConversation → assistantAPI → /assistant/chat → /internal/llm/chat (memory enabled)
 */

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { MessageCircle, X, Send, Loader2, Minimize2 } from 'lucide-react';
import { useFIConversation } from '@/hooks/useFIConversation';
import { FIMessageBubble } from './onboarding/FIMessageBubble';
import { FITypingIndicator } from './onboarding/FITypingIndicator';

export function ChatWidget() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');

  // Use conversation hook with doctor_id from Auth0
  const {
    messages,
    loading,
    isTyping,
    sendMessage,
    getIntroduction,
  } = useFIConversation({
    phase: 'general',
    context: {
      doctor_id: user?.sub, // Auth0 user.sub as doctor_id
      doctor_name: user?.name,
    },
    storageKey: 'fi_chat_widget',
    autoIntroduction: false, // Don't auto-introduce, wait for user to open
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const chatContainer = document.getElementById('chat-widget-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages, isOpen, isMinimized]);

  // Handle opening widget (load introduction if first time)
  const handleOpen = async () => {
    setIsOpen(true);
    setIsMinimized(false);

    // If no messages yet, get introduction
    if (messages.length === 0) {
      await getIntroduction();
    }
  };

  // Handle send message
  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage(''); // Clear input immediately

    await sendMessage(userMessage);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Closed state - Floating button
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center group"
        aria-label="Chat with Free Intelligence"
      >
        <MessageCircle className="h-6 w-6 text-white" />

        {/* Notification badge (future: unread count) */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Habla con Free Intelligence
        </div>
      </button>
    );
  }

  // Minimized state - Compact bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 flex items-center gap-3 px-4 py-3 hover:bg-slate-750 transition-colors cursor-pointer"
           onClick={() => setIsMinimized(false)}>
        <MessageCircle className="h-5 w-5 text-purple-400" />
        <span className="text-sm font-medium text-white">Free Intelligence</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="ml-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Open state - Full chat panel
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Free Intelligence</h3>
            <p className="text-xs text-purple-200">Tu asistente médico residente</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Minimize"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        id="chat-widget-messages"
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 custom-scrollbar"
      >
        {messages.map((msg, idx) => (
          <FIMessageBubble key={idx} message={msg} />
        ))}

        {isTyping && <FITypingIndicator />}

        {messages.length === 0 && !isTyping && (
          <div className="text-center text-slate-500 text-sm mt-8">
            Hola {user?.name?.split(' ')[0] || 'Doctor'},<br />
            pregúntame lo que necesites...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 p-4 bg-slate-900">
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            disabled={loading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-12 disabled:opacity-50"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl px-4 py-2 hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Info footer */}
        <p className="text-xs text-slate-600 mt-2 text-center">
          Memoria infinita activa · Azure GPT-4
        </p>
      </div>
    </div>
  );
}
