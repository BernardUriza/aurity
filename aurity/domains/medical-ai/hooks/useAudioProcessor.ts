/**
 * Audio Processor Hook - Stub
 *
 * Stub temporal para compilación TypeScript.
 * TODO: Reemplazar por implementación real con denoising/filtering.
 *
 * Este stub proporciona una interfaz no-op que devuelve audio sin procesar.
 */

import { useCallback, useState } from 'react';

export interface AudioProcessorConfig {
  enabled?: boolean;
  environment?: 'consultorio' | 'urgencias' | 'uci' | 'cirugia';
  sampleRate?: number;
  onAudioData?: (audioData: Float32Array) => void;
  bufferSize?: number;
}

export interface ProcessorState {
  isReady: boolean;
  isProcessing: boolean;
  error: string | null;
}

export interface UseAudioProcessorReturn {
  process: (audioData: Float32Array | Blob) => Promise<Float32Array | Blob>;
  start: () => void;
  stop: () => void;
  dispose: () => void;
  state: ProcessorState;
}

/**
 * Audio processor hook stub - no-op implementation
 * Returns audio data unmodified (identity function)
 */
export function useAudioProcessor(
  config: AudioProcessorConfig = {}
): UseAudioProcessorReturn {
  const [state, setState] = useState<ProcessorState>({
    isReady: true,
    isProcessing: false,
    error: null,
  });

  const process = useCallback(
    async (audioData: Float32Array | Blob): Promise<Float32Array | Blob> => {
      // No-op: return input unchanged
      return audioData;
    },
    []
  );

  const start = useCallback(() => {
    setState(prev => ({ ...prev, isReady: true }));
  }, []);

  const stop = useCallback(() => {
    setState(prev => ({ ...prev, isProcessing: false }));
  }, []);

  const dispose = useCallback(() => {
    setState({ isReady: false, isProcessing: false, error: null });
  }, []);

  return {
    process,
    start,
    stop,
    dispose,
    state,
  };
}
