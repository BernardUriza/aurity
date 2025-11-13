/**
 * useDemoMode Hook
 *
 * Maneja la reproducción de audio de demostración con controles play/pause/resume.
 * Extraído de ConversationCapture durante refactoring incremental.
 *
 * @example
 * const { isDemoPlaying, isDemoPaused, playDemo, pauseDemo, resumeDemo } =
 *   useDemoMode('/static/consulta_demo.mp3');
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDemoModeReturn {
  isDemoPlaying: boolean;
  isDemoPaused: boolean;
  playDemo: () => Promise<void>;
  pauseDemo: () => void;
  resumeDemo: () => Promise<void>;
  stopDemo: () => void;
}

export function useDemoMode(demoAudioUrl: string): UseDemoModeReturn {
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [isDemoPaused, setIsDemoPaused] = useState(false);
  const demoAudioRef = useRef<HTMLAudioElement | null>(null);

  // Play demo audio
  const playDemo = useCallback(async () => {
    console.log('[Demo] Starting demo consultation playback...');
    setIsDemoPlaying(true);
    setIsDemoPaused(false);

    // Create audio element if not exists
    if (!demoAudioRef.current) {
      demoAudioRef.current = new Audio(demoAudioUrl);
      demoAudioRef.current.onended = () => {
        console.log('[Demo] Audio playback finished');
        setIsDemoPlaying(false);
        setIsDemoPaused(false);
      };
    }

    // Play audio in browser
    demoAudioRef.current.currentTime = 0;
    await demoAudioRef.current.play();
    console.log('[Demo] Playing audio for user...');
  }, [demoAudioUrl]);

  // Pause demo audio
  const pauseDemo = useCallback(() => {
    if (demoAudioRef.current) {
      console.log('[Demo] Pausing playback...');
      demoAudioRef.current.pause();
      setIsDemoPaused(true);
    }
  }, []);

  // Resume demo audio
  const resumeDemo = useCallback(async () => {
    if (demoAudioRef.current) {
      console.log('[Demo] Resuming playback...');
      await demoAudioRef.current.play();
      setIsDemoPaused(false);
    }
  }, []);

  // Stop demo audio
  const stopDemo = useCallback(() => {
    if (demoAudioRef.current) {
      demoAudioRef.current.pause();
      demoAudioRef.current.currentTime = 0;
      setIsDemoPlaying(false);
      setIsDemoPaused(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (demoAudioRef.current) {
        demoAudioRef.current.pause();
        demoAudioRef.current = null;
      }
    };
  }, []);

  return {
    isDemoPlaying,
    isDemoPaused,
    playDemo,
    pauseDemo,
    resumeDemo,
    stopDemo,
  };
}
