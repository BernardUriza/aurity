/**
 * useDemoMode Hook
 *
 * Maneja la reproducción de audio de demostración con captura de MediaStream.
 * Usa Web Speech API (text-to-speech) para generar consulta sintética.
 * Crea un MediaStream desde el audio para simular entrada de micrófono.
 *
 * @example
 * const { isDemoPlaying, isDemoPaused, demoStream, playDemo, pauseDemo, resumeDemo, stopDemo } =
 *   useDemoMode();
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { DEMO_CONSULTATION, DialogueLine } from '@/lib/demo/consultation-script';

interface UseDemoModeReturn {
  isDemoPlaying: boolean;
  isDemoPaused: boolean;
  demoStream: MediaStream | null;
  playDemo: () => Promise<void>;
  pauseDemo: () => void;
  resumeDemo: () => Promise<void>;
  stopDemo: () => void;
}

export function useDemoMode(): UseDemoModeReturn {
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [isDemoPaused, setIsDemoPaused] = useState(false);
  const [demoStream, setDemoStream] = useState<MediaStream | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentIndexRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  // Initialize Web Audio API context and create silent MediaStream
  // NOTE: speechSynthesis output cannot be captured directly, so we create
  // a silent audio stream that MediaRecorder can accept, while TTS plays separately
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create silent oscillator to generate capturable audio stream
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0; // Silent (amplitude = 0)

      mediaStreamDestinationRef.current = audioContextRef.current.createMediaStreamDestination();

      // Connect: oscillator → gain (silent) → destination (MediaStream)
      oscillator.connect(gainNode);
      gainNode.connect(mediaStreamDestinationRef.current);

      oscillator.start();

      setDemoStream(mediaStreamDestinationRef.current.stream);
      console.log('[Demo] Web Audio context initialized with silent MediaStream for recording');
    }
  }, []);

  // Speak one line of dialogue
  const speakLine = useCallback((line: DialogueLine, index: number) => {
    return new Promise<void>((resolve) => {
      if (isPausedRef.current) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(line.text);

      // Select voice based on speaker (doctor = male, patient = female when available)
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(v => v.lang.startsWith('es'));

      if (spanishVoices.length > 0) {
        // Prefer different voices for doctor vs patient
        if (line.speaker === 'doctor') {
          const maleVoice = spanishVoices.find(v => v.name.toLowerCase().includes('male')) || spanishVoices[0];
          utterance.voice = maleVoice;
        } else {
          const femaleVoice = spanishVoices.find(v => v.name.toLowerCase().includes('female')) || spanishVoices[0];
          utterance.voice = femaleVoice;
        }
      }

      utterance.lang = 'es-MX'; // Mexican Spanish
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = line.speaker === 'doctor' ? 0.9 : 1.1; // Lower pitch for doctor

      utterance.onend = () => {
        console.log(`[Demo TTS] Finished line ${index + 1}: "${line.text.substring(0, 40)}..."`);

        // Wait for pause duration if specified
        if (line.pauseAfterMs && line.pauseAfterMs > 0) {
          setTimeout(() => resolve(), line.pauseAfterMs);
        } else {
          resolve();
        }
      };

      utterance.onerror = (error) => {
        console.error('[Demo TTS] Error:', error);
        resolve(); // Continue even on error
      };

      utterancesRef.current[index] = utterance;
      console.log(`[Demo TTS] Speaking line ${index + 1} (${line.speaker}): "${line.text.substring(0, 40)}..."`);
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Play demo consultation using TTS
  const playDemo = useCallback(async () => {
    console.log('[Demo] Starting TTS demo consultation...');

    // Initialize audio context
    initAudioContext();

    setIsDemoPlaying(true);
    setIsDemoPaused(false);
    isPausedRef.current = false;
    currentIndexRef.current = 0;

    // Speak each line sequentially
    for (let i = 0; i < DEMO_CONSULTATION.length; i++) {
      if (isPausedRef.current) {
        console.log('[Demo] Paused at line', i + 1);
        currentIndexRef.current = i;
        break;
      }

      await speakLine(DEMO_CONSULTATION[i], i);
      currentIndexRef.current = i + 1;
    }

    // If completed (not paused)
    if (currentIndexRef.current >= DEMO_CONSULTATION.length) {
      console.log('[Demo] TTS consultation finished');
      setIsDemoPlaying(false);
      setIsDemoPaused(false);
      currentIndexRef.current = 0;
    }
  }, [initAudioContext, speakLine]);

  // Pause demo
  const pauseDemo = useCallback(() => {
    console.log('[Demo] Pausing TTS...');
    isPausedRef.current = true;
    window.speechSynthesis.cancel(); // Stop current utterance
    setIsDemoPaused(true);
  }, []);

  // Resume demo
  const resumeDemo = useCallback(async () => {
    console.log('[Demo] Resuming TTS from line', currentIndexRef.current + 1);
    isPausedRef.current = false;
    setIsDemoPaused(false);

    // Continue from where we left off
    for (let i = currentIndexRef.current; i < DEMO_CONSULTATION.length; i++) {
      if (isPausedRef.current) {
        currentIndexRef.current = i;
        break;
      }

      await speakLine(DEMO_CONSULTATION[i], i);
      currentIndexRef.current = i + 1;
    }

    // If completed
    if (currentIndexRef.current >= DEMO_CONSULTATION.length) {
      console.log('[Demo] TTS consultation finished');
      setIsDemoPlaying(false);
      setIsDemoPaused(false);
      currentIndexRef.current = 0;
    }
  }, [speakLine]);

  // Stop demo
  const stopDemo = useCallback(() => {
    console.log('[Demo] Stopping TTS...');
    isPausedRef.current = true;
    window.speechSynthesis.cancel();
    setIsDemoPlaying(false);
    setIsDemoPaused(false);
    currentIndexRef.current = 0;

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setDemoStream(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    isDemoPlaying,
    isDemoPaused,
    demoStream,
    playDemo,
    pauseDemo,
    resumeDemo,
    stopDemo,
  };
}
