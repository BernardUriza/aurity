/**
 * VoiceMicButton Component
 *
 * Botón de micrófono para chat con animación VAD (Voice Activity Detection).
 *
 * Features:
 * - Animación de anillos concéntricos que pulsan con el nivel de audio
 * - Estados visuales: idle → recording → transcribing
 * - Feedback visual de voz detectada (verde) vs silencio (rojo)
 * - Timer de grabación
 * - Smooth transitions con Framer Motion
 *
 * UX Design:
 * ```
 * IDLE:        [Mic Icon]  (gris, estático)
 * RECORDING:   [Mic Icon]  (rojo, anillos pulsando con VAD)
 *              ↓ verde cuando detecta voz
 *              ↓ rojo cuando silencio
 * TRANSCRIBING: [Spinner]  (azul, procesando)
 * ```
 *
 * @example
 * <VoiceMicButton
 *   isRecording={isRecording}
 *   isTranscribing={isTranscribing}
 *   audioLevel={audioLevel}
 *   isSilent={isSilent}
 *   recordingTime={recordingTime}
 *   onStart={() => startRecording()}
 *   onStop={() => stopRecording()}
 * />
 */

'use client';

import { Mic, Square, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceMicButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  audioLevel: number; // 0-255 (from Web Audio API)
  isSilent: boolean;
  recordingTime: number; // seconds
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

export function VoiceMicButton({
  isRecording,
  isTranscribing,
  audioLevel,
  isSilent,
  recordingTime,
  onStart,
  onStop,
  className = '',
}: VoiceMicButtonProps) {
  // Format recording time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate scale based on audio level (0-255 → 1.0-1.5 scale)
  // Higher audio level = larger rings
  const audioScale = isRecording && !isSilent ? 1 + (audioLevel / 255) * 0.5 : 1;

  // Ring color: verde when voice detected, rojo when silent
  const ringColor = isRecording ? (isSilent ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)') : 'rgb(156, 163, 175)';

  const handleClick = () => {
    console.log('[VoiceMicButton] Click!', { isRecording, isTranscribing });

    if (isRecording) {
      console.log('[VoiceMicButton] Stopping recording...');
      onStop();
    } else if (!isTranscribing) {
      console.log('[VoiceMicButton] Starting recording...');
      onStart();
    } else {
      console.log('[VoiceMicButton] Transcribing, ignoring click');
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-3 ${className}`}>
      {/* Mic Button Container */}
      <div className="relative">
        {/* Animated VAD Rings (only when recording) */}
        {isRecording && (
          <>
            {/* Ring 1 (innermost) */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 opacity-60"
              style={{
                borderColor: ringColor,
              }}
              animate={{
                scale: [1, audioScale * 1.2, 1],
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Ring 2 (middle) */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 opacity-40"
              style={{
                borderColor: ringColor,
              }}
              animate={{
                scale: [1, audioScale * 1.4, 1],
                opacity: [0.4, 0.2, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.2,
              }}
            />

            {/* Ring 3 (outermost) */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 opacity-20"
              style={{
                borderColor: ringColor,
              }}
              animate={{
                scale: [1, audioScale * 1.6, 1],
                opacity: [0.2, 0.1, 0.2],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.4,
              }}
            />
          </>
        )}

        {/* Button */}
        <motion.button
          onClick={handleClick}
          disabled={isTranscribing}
          className={`
            relative z-10 flex items-center justify-center
            w-12 h-12 rounded-full
            transition-all duration-200
            ${
              isRecording
                ? isSilent
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
            }
            ${isTranscribing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            shadow-lg hover:shadow-xl
          `}
          whileTap={!isTranscribing ? { scale: 0.95 } : {}}
          animate={{
            scale: isRecording && !isSilent ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 0.6,
            repeat: isRecording && !isSilent ? Infinity : 0,
            ease: 'easeInOut',
          }}
        >
          {isTranscribing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <Square className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {/* Recording Timer (only when recording) */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center gap-2 text-sm font-mono"
        >
          {/* Recording dot */}
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{
              opacity: [1, 0.3, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Time */}
          <span className="text-gray-700 dark:text-gray-300 font-semibold">
            {formatTime(recordingTime)}
          </span>
        </motion.div>
      )}

      {/* Transcribing indicator */}
      {isTranscribing && !isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-blue-600 dark:text-blue-400 font-medium"
        >
          Transcribiendo...
        </motion.div>
      )}
    </div>
  );
}
