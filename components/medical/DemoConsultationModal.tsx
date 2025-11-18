/**
 * DemoConsultationModal Component
 *
 * Interactive demo modal that simulates consultation workflow:
 * 1. Shows dialogue line-by-line (editable)
 * 2. User clicks "Enviar" → TTS generates audio + sends chunk to backend
 * 3. Audio plays while chunk is processed (transcription, diarization)
 * 4. Simulates complete recording workflow without microphone
 *
 * Created: 2025-11-17
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, Send, Mic, User } from 'lucide-react';
import { DEMO_CONSULTATION, type DialogueLine } from '@/lib/demo/consultation-script';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

interface DemoConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendChunk: (audioBlob: Blob, lineIndex: number) => Promise<void>;
  isProcessing: boolean;
}

export function DemoConsultationModal({
  isOpen,
  onClose,
  onSendChunk,
  isProcessing,
}: DemoConsultationModalProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [editedText, setEditedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const currentLine = DEMO_CONSULTATION[currentLineIndex];
  const isLastLine = currentLineIndex === DEMO_CONSULTATION.length - 1;

  // Initialize edited text when line changes
  const resetEditedText = useCallback(() => {
    if (currentLine) {
      setEditedText(currentLine.text);
    }
  }, [currentLine]);

  // Reset when modal opens
  const handleOpen = useCallback(() => {
    if (isOpen && currentLineIndex === 0) {
      resetEditedText();
    }
  }, [isOpen, currentLineIndex, resetEditedText]);

  // Effect to reset text when line changes or modal opens
  useEffect(() => {
    handleOpen();
  }, [handleOpen]);

  useEffect(() => {
    resetEditedText();
  }, [currentLineIndex, resetEditedText]);

  // Generate TTS audio and send as chunk
  const handleSendLine = async () => {
    if (!editedText.trim() || isGenerating || isProcessing) return;

    setIsGenerating(true);

    try {
      // 1. Call TTS endpoint to generate audio
      console.log(`[Demo] Generating TTS for line ${currentLineIndex + 1}...`);

      const ttsResponse = await fetch(`${BACKEND_URL}/api/tts/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editedText,
          voice: currentLine.speaker === 'doctor' ? 'alloy' : 'nova',
          speed: 0.9,
        }),
      });

      if (!ttsResponse.ok) {
        throw new Error(`TTS failed: ${ttsResponse.status}`);
      }

      const audioBlob = await ttsResponse.blob();
      console.log(`[Demo] TTS generated: ${(audioBlob.size / 1024).toFixed(2)} KB`);

      // 2. Play audio for user feedback
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);

      audio.play();
      console.log('[Demo] Playing TTS audio...');

      // 3. Send audio chunk to backend (simulates real recording)
      await onSendChunk(audioBlob, currentLineIndex);

      // 4. Wait for audio to finish playing
      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setCurrentAudio(null);
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setCurrentAudio(null);
          resolve();
        };
      });

      // 5. Apply natural pause if specified
      if (currentLine.pauseAfterMs && currentLine.pauseAfterMs > 0) {
        console.log(`[Demo] Pausing ${currentLine.pauseAfterMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, currentLine.pauseAfterMs));
      }

      // 6. Move to next line
      if (!isLastLine) {
        setCurrentLineIndex((prev) => prev + 1);
      } else {
        console.log('[Demo] Consultation complete');
        // Keep modal open on last line so user can review
      }
    } catch (error) {
      console.error('[Demo] Error generating/sending line:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Stop audio playback
  const handleStopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
  };

  // Reset demo
  const handleReset = () => {
    handleStopAudio();
    setCurrentLineIndex(0);
    setEditedText(DEMO_CONSULTATION[0].text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">Demo Consulta Médica</h2>
            <p className="text-sm text-slate-400 mt-1">
              Línea {currentLineIndex + 1} de {DEMO_CONSULTATION.length}
            </p>
          </div>
          <button
            onClick={() => {
              handleStopAudio();
              onClose();
            }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
            style={{
              width: `${((currentLineIndex + 1) / DEMO_CONSULTATION.length) * 100}%`,
            }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Speaker indicator */}
          <div className="flex items-center gap-3">
            {currentLine.speaker === 'doctor' ? (
              <>
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <User className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-cyan-400">Doctor</p>
                  <p className="text-xs text-slate-500">Voz: Alloy (masculina)</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <Mic className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-400">Paciente</p>
                  <p className="text-xs text-slate-500">Voz: Nova (femenina)</p>
                </div>
              </>
            )}
          </div>

          {/* Editable text area */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Texto a sintetizar (editable):
            </label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              disabled={isGenerating || isProcessing}
              className="w-full h-32 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              placeholder="Escribe el texto para la línea de diálogo..."
            />
            <p className="text-xs text-slate-500 mt-2">
              {editedText.length} caracteres (máx 4096)
            </p>
          </div>

          {/* Status indicators */}
          {isGenerating && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent" />
              <span className="text-sm text-amber-400">Generando audio con TTS...</span>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-500 border-t-transparent" />
              <span className="text-sm text-cyan-400">Procesando chunk (transcripción)...</span>
            </div>
          )}

          {currentAudio && (
            <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="animate-pulse h-4 w-4 bg-purple-500 rounded-full" />
              <span className="text-sm text-purple-400">Reproduciendo audio...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={handleReset}
            disabled={isGenerating || isProcessing}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reiniciar
          </button>

          <div className="flex gap-3">
            {currentAudio && (
              <button
                onClick={handleStopAudio}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Detener Audio
              </button>
            )}

            <button
              onClick={handleSendLine}
              disabled={
                !editedText.trim() ||
                isGenerating ||
                isProcessing ||
                editedText.length > 4096
              }
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-purple-500"
            >
              <Send className="h-4 w-4" />
              {isLastLine ? 'Enviar y Finalizar' : 'Enviar Línea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
