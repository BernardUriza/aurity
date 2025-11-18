/**
 * DoctorControlPanel - TV Display Control Interface
 *
 * Card: FI-UI-FEAT-TVD-001
 * Comprehensive TV control with Messages, Media Upload, and AI Content
 *
 * Features:
 * - Tab 1: Text Messages (quick messages + custom)
 * - Tab 2: Multimedia Upload (images, videos)
 * - Tab 3: AI Content Generator (health tips, trivia)
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MediaUploader, type UploadedMedia } from './MediaUploader';
import { MessageSquare, Film, Sparkles } from 'lucide-react';

interface DoctorControlPanelProps {
  /** Callback when message is sent to TV */
  onMessageSend: (message: string) => void;

  /** Current message being displayed (if any) */
  currentMessage?: string | null;

  /** Clinic name for context */
  clinicName?: string;

  /** Doctor ID for media uploads */
  doctorId?: string;

  /** Clinic ID for media categorization */
  clinicId?: string;
}

export function DoctorControlPanel({
  onMessageSend,
  currentMessage = null,
  clinicName = 'la clínica',
  doctorId,
  clinicId,
}: DoctorControlPanelProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('messages');

  // Predefined quick messages
  const quickMessages = [
    '⏰ Retraso de 15 minutos en consultas',
    '🚻 Favor de mantener silencio en sala de espera',
    '💧 Agua disponible en el dispensador',
    '📋 Traer estudios previos a consulta',
    '🔔 Esperar llamado por nombre',
  ];

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    setIsSending(true);

    // Simulate API call delay
    setTimeout(() => {
      onMessageSend(messageInput.trim());
      setMessageInput('');
      setIsSending(false);
    }, 500);
  };

  const handleQuickMessage = (message: string) => {
    setIsSending(true);

    setTimeout(() => {
      onMessageSend(message);
      setIsSending(false);
    }, 500);
  };

  const handleClearMessage = () => {
    setIsSending(true);

    setTimeout(() => {
      onMessageSend('');
      setIsSending(false);
    }, 500);
  };

  const handleMediaUpload = (media: UploadedMedia) => {
    console.log('Media uploaded:', media);
    // TODO: Add to carousel rotation
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Control de TV
              </h2>
              <p className="text-sm text-slate-400">Contenido para sala de espera · {clinicName}</p>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50"></div>
              <span className="text-xs font-medium text-purple-400 tracking-wide">TRANSMITIENDO</span>
            </div>
          </div>

          {/* Tabs Navigation */}
          <TabsList className="bg-slate-900/80 p-1 w-full grid grid-cols-3 gap-1">
            <TabsTrigger
              value="messages"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-white rounded-md transition-all"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Mensajes
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-white rounded-md transition-all"
            >
              <Film className="w-4 h-4 mr-2" />
              Multimedia
            </TabsTrigger>
            <TabsTrigger
              value="ai-content"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-white rounded-md transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Contenido IA
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: Messages */}
        <TabsContent value="messages" className="mt-0">
          {/* Current Message Display */}
          {currentMessage && (
            <div className="px-6 py-4 bg-purple-950/20 border-b border-purple-700/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs text-purple-300 font-medium mb-1">MENSAJE ACTUAL EN TV</p>
                  <p className="text-sm text-white">{currentMessage}</p>
                </div>
                <button
                  onClick={handleClearMessage}
                  disabled={isSending}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white text-xs rounded-lg transition-colors"
                >
                  Quitar
                </button>
              </div>
            </div>
          )}

          {/* Message Composer */}
          <div className="p-6 space-y-4">
        {/* Custom Message Input */}
        <div>
          <label htmlFor="tv-message" className="block text-sm font-medium text-slate-300 mb-2">
            Mensaje Personalizado
          </label>
          <div className="flex gap-2">
            <textarea
              id="tv-message"
              rows={3}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Escribe un mensaje para los pacientes en sala de espera..."
              className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm resize-none"
              disabled={isSending}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              {messageInput.length}/280 caracteres
            </span>
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isSending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar a TV
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Messages */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Mensajes Rápidos
          </label>
          <div className="grid grid-cols-1 gap-2">
            {quickMessages.map((message, index) => (
              <button
                key={index}
                onClick={() => handleQuickMessage(message)}
                disabled={isSending}
                className="px-4 py-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-600 hover:border-purple-500/50 disabled:bg-slate-900 disabled:cursor-not-allowed text-left text-sm text-slate-300 hover:text-white rounded-lg transition-all group"
              >
                <span className="group-hover:text-purple-300">{message}</span>
              </button>
            ))}
          </div>
        </div>

            {/* Preview Mode Info */}
            <div className="pt-4 border-t border-slate-700/50">
              <div className="flex items-start gap-3 p-3 bg-blue-950/20 border border-blue-700/30 rounded-lg">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-300 mb-1">Vista Previa de TV</p>
                  <p className="text-xs text-blue-400/80 leading-relaxed">
                    Los mensajes se intercalan con tips de salud y filosofía de Free Intelligence.
                    Tus mensajes aparecen cada ~1-2 minutos con duración de 20 segundos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Media Upload */}
        <TabsContent value="media" className="mt-0">
          <div className="p-6">
            <MediaUploader
              onMediaUpload={handleMediaUpload}
              clinicId={clinicId}
              doctorId={doctorId}
            />
          </div>
        </TabsContent>

        {/* TAB 3: AI Content Generator */}
        <TabsContent value="ai-content" className="mt-0">
          <div className="p-6">
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Generador de Contenido IA</h3>
              <p className="text-sm text-slate-400 mb-6">
                Genera tips de salud y trivias educativas con Free Intelligence
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-lg text-sm">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Próximamente
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
