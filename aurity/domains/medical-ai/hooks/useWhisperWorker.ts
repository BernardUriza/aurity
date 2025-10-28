import { useRef, useCallback, useEffect, useState } from 'react';
import { whisperModelCache } from '../services/whisperModelCache';

interface UseWhisperWorkerOptions {
  onChunkProcessed?: (text: string, chunkId: string) => void;
  onChunkProgress?: (chunkId: string, progress: number) => void;
  onError?: (error: string) => void;
  onModelLoading?: (progress: number) => void;
  onModelReady?: () => void;
}

export function useWhisperWorker(options: UseWhisperWorkerOptions = {}) {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const resultsRef = useRef<Map<string, string>>(new Map());
  const pendingChunksRef = useRef<Set<string>>(new Set());
  const cleanupRef = useRef<(() => void) | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    let mounted = true;

    const setupWorker = async () => {
      try {
        // Get or create worker from cache
        const worker = await whisperModelCache.getWorker();
        workerRef.current = worker;
        
        // Check if model is already loaded after getting worker
        if (whisperModelCache.isModelLoaded()) {
          if (mounted) {
            console.log('[useWhisperWorker] Model already loaded, setting ready state');
            setIsReady(true);
            options.onModelReady?.();
          }
        }

        // Add message listener
        const cleanup = whisperModelCache.addMessageListener((event) => {
          if (!mounted) return;
          
          const { type, ...data } = event.data;

          switch (type) {
            case 'MODEL_LOADING':
              options.onModelLoading?.(data.progress);
              break;

            case 'MODEL_READY':
              setIsReady(true);
              options.onModelReady?.();
              break;

            case 'CHUNK_PROGRESS':
              options.onChunkProgress?.(data.chunkId, data.progress);
              break;

            case 'CHUNK_PROCESSED':
              // Skip if this chunk is no longer pending (component might have unmounted)
              if (!pendingChunksRef.current.has(data.chunkId)) {
                console.log(`[useWhisperWorker] Ignoring processed chunk ${data.chunkId} - no longer pending`);
                break;
              }
              resultsRef.current.set(data.chunkId, data.text);
              pendingChunksRef.current.delete(data.chunkId);
              options.onChunkProcessed?.(data.text, data.chunkId);
              if (pendingChunksRef.current.size === 0) {
                setIsProcessing(false);
              }
              break;

            case 'CHUNK_TOO_SMALL':
              pendingChunksRef.current.delete(data.chunkId);
              console.error(`[useWhisperWorker] ${data.error}`);
              options.onError?.(data.error);
              if (pendingChunksRef.current.size === 0) {
                setIsProcessing(false);
              }
              break;

            case 'PROCESSING_ERROR':
              pendingChunksRef.current.delete(data.chunkId);
              options.onError?.(data.error);
              if (pendingChunksRef.current.size === 0) {
                setIsProcessing(false);
              }
              break;

            case 'ERROR':
              options.onError?.(data.error);
              setIsReady(false);
              break;
          }
        });

        cleanupRef.current = cleanup;
      } catch (error) {
        if (mounted) {
          options.onError?.(`Failed to initialize worker: ${error}`);
        }
      }
    };

    setupWorker();

    return () => {
      console.log('[useWhisperWorker] Component unmounting, cleaning up...');
      mounted = false;
      
      // Clean up pending chunks to prevent orphaned processing
      if (pendingChunksRef.current.size > 0) {
        console.warn(`[useWhisperWorker] Unmounting with ${pendingChunksRef.current.size} pending chunks`);
        pendingChunksRef.current.clear();
      }
      
      // Clear results to prevent memory leaks
      resultsRef.current.clear();
      
      // Reset processing state
      setIsProcessing(false);
      
      // Remove message listener
      cleanupRef.current?.();
    };
  }, []);

  const processChunk = useCallback(async (audioData: Float32Array, chunkId: string) => {
    if (!isReady) {
      throw new Error('Worker not ready');
    }

    setIsProcessing(true);
    pendingChunksRef.current.add(chunkId);

    const audioBuffer = audioData.buffer.slice(0);
    const audioDataCopy = new Float32Array(audioBuffer);

    whisperModelCache.sendMessage(
      { type: 'PROCESS_CHUNK', data: { audioData: audioDataCopy, chunkId } },
      [audioBuffer]
    );
  }, [isReady]);

  const getTranscript = useCallback(() => {
    const results = Array.from(resultsRef.current.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, text]) => text)
      .join(' ');
    return results;
  }, []);

  const reset = useCallback(() => {
    resultsRef.current.clear();
    pendingChunksRef.current.clear();
    setIsProcessing(false);
    whisperModelCache.sendMessage({ type: 'RESET' });
  }, []);

  return {
    isReady,
    isProcessing,
    processChunk,
    getTranscript,
    reset
  };
}