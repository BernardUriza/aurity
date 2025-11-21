'use client';

/**
 * ChatToolbar Component
 *
 * Toolbar with action buttons for chat functionality:
 * - Attach files
 * - Change language
 * - Text formatting
 * - Theme toggle
 * - Voice input
 */

import { Plus, Globe, Type, Zap, FileText, Brain } from 'lucide-react';
import { VoiceMicButton } from './VoiceMicButton';

export type ResponseMode = 'explanatory' | 'concise';
export type PersonaType = 'soap_editor' | 'clinical_advisor' | 'general_assistant' | 'onboarding_guide';

export interface ChatToolbarProps {
  /** Enable/disable attach button */
  showAttach?: boolean;

  /** Enable/disable language button */
  showLanguage?: boolean;

  /** Enable/disable formatting button */
  showFormatting?: boolean;

  /** Enable/disable response mode toggle button */
  showResponseMode?: boolean;

  /** Enable/disable voice button */
  showVoice?: boolean;

  /** Enable/disable persona selector */
  showPersonaSelector?: boolean;

  /** Current response mode ('explanatory' | 'concise') */
  responseMode?: ResponseMode;

  /** Current selected persona */
  selectedPersona?: PersonaType;

  /** Voice recording state (NEW: for VoiceMicButton) */
  voiceRecording?: {
    isRecording: boolean;
    isTranscribing: boolean;
    audioLevel: number;
    isSilent: boolean;
    recordingTime: number;
  };

  /** Callbacks */
  onAttach?: () => void;
  onLanguage?: () => void;
  onFormatting?: () => void;
  onResponseModeToggle?: () => void;
  onPersonaChange?: (persona: PersonaType) => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
}

const PERSONA_OPTIONS: { value: PersonaType; label: string; icon: string }[] = [
  { value: 'general_assistant', label: 'General', icon: '🩺' },
  { value: 'soap_editor', label: 'SOAP Editor', icon: '📋' },
  { value: 'clinical_advisor', label: 'Advisor', icon: '🔬' },
  { value: 'onboarding_guide', label: 'Guide', icon: '🎯' },
];

export function ChatToolbar({
  showAttach = true,
  showLanguage = true,
  showFormatting = true,
  showResponseMode = true,
  showVoice = true,
  showPersonaSelector = true,
  responseMode = 'explanatory',
  selectedPersona = 'general_assistant',
  voiceRecording,
  onAttach,
  onLanguage,
  onFormatting,
  onResponseModeToggle,
  onPersonaChange,
  onVoiceStart,
  onVoiceStop,
}: ChatToolbarProps) {
  // Debug logging (removed to prevent render loops)
  // console.log('[ChatToolbar] Props:', {
  //   showVoice,
  //   voiceRecording,
  //   hasOnVoiceStart: !!onVoiceStart,
  //   hasOnVoiceStop: !!onVoiceStop,
  // });

  const buttonBaseClass = `
    p-2.5 rounded-lg
    text-slate-400 hover:text-white hover:bg-slate-700/50
    transition-all duration-200
    disabled:opacity-40 disabled:cursor-not-allowed
    active:scale-95
  `;

  return (
    <div className="
      flex items-center justify-between gap-2
      px-4 py-2
      border-t border-slate-700/50
      bg-slate-900/95 backdrop-blur-sm
    ">
      {/* Left side: Utility actions */}
      <div className="flex items-center gap-1">
        {showPersonaSelector && (
          <div className="relative">
            <select
              value={selectedPersona}
              onChange={(e) => onPersonaChange?.(e.target.value as PersonaType)}
              className="
                px-3 py-2 pr-8
                rounded-lg
                bg-slate-800/80 hover:bg-slate-700/80
                border border-slate-600/50
                text-slate-200 text-sm
                cursor-pointer
                transition-all duration-200
                appearance-none
                focus:outline-none focus:ring-2 focus:ring-purple-500/50
              "
              title="Seleccionar AI Persona"
              aria-label="Seleccionar AI Persona"
            >
              {PERSONA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
            <Brain className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}

        {showAttach && (
          <button
            onClick={onAttach}
            className={buttonBaseClass}
            title="Adjuntar archivo"
            aria-label="Adjuntar archivo"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        {showLanguage && (
          <button
            onClick={onLanguage}
            className={buttonBaseClass}
            title="Cambiar idioma"
            aria-label="Cambiar idioma"
          >
            <Globe className="w-5 h-5" />
          </button>
        )}

        {showFormatting && (
          <button
            onClick={onFormatting}
            className={buttonBaseClass}
            title="Formato de texto"
            aria-label="Formato de texto"
          >
            <Type className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Right side: Response Mode & Voice */}
      <div className="flex items-center gap-1">
        {showResponseMode && (
          <button
            onClick={onResponseModeToggle}
            className={`${buttonBaseClass} ${responseMode === 'concise' ? 'text-cyan-400 hover:text-cyan-300' : 'text-emerald-400 hover:text-emerald-300'}`}
            title={responseMode === 'explanatory' ? 'Modo: Explicativo (detallado)' : 'Modo: Conciso (breve)'}
            aria-label={responseMode === 'explanatory' ? 'Cambiar a modo conciso' : 'Cambiar a modo explicativo'}
          >
            {responseMode === 'explanatory' ? (
              <FileText className="w-5 h-5" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
          </button>
        )}

        {showVoice && (
          <VoiceMicButton
            isRecording={voiceRecording?.isRecording || false}
            isTranscribing={voiceRecording?.isTranscribing || false}
            audioLevel={voiceRecording?.audioLevel || 0}
            isSilent={voiceRecording?.isSilent ?? true}
            recordingTime={voiceRecording?.recordingTime || 0}
            onStart={onVoiceStart || (() => {})}
            onStop={onVoiceStop || (() => {})}
          />
        )}
      </div>
    </div>
  );
}
