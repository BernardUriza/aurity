// Global cache for Whisper model to prevent multiple downloads
// Persists across page reloads and route changes
declare global {
  var __WHISPER_WORKER_INSTANCE__: Worker | undefined;
  var __WHISPER_MODEL_LOADED__: boolean | undefined;
  var __WHISPER_LOADING_PROMISE__: Promise<void> | undefined;
}

class WhisperModelCache {
  private static instance: WhisperModelCache;
  private modelLoaded: boolean = false;
  private loadingPromise: Promise<void> | null = null;
  private worker: Worker | null = null;
  private listeners: Set<(event: MessageEvent) => void> = new Set();
  
  private constructor() {
    // Restore from global cache if available
    if (typeof window !== 'undefined') {
      if (global.__WHISPER_WORKER_INSTANCE__) {
        this.worker = global.__WHISPER_WORKER_INSTANCE__;
        this.modelLoaded = global.__WHISPER_MODEL_LOADED__ || false;
        console.log('[WhisperCache] Restored worker from global cache');
      }
      if (global.__WHISPER_LOADING_PROMISE__) {
        this.loadingPromise = global.__WHISPER_LOADING_PROMISE__;
      }
    }
  }
  
  static getInstance(): WhisperModelCache {
    if (!WhisperModelCache.instance) {
      WhisperModelCache.instance = new WhisperModelCache();
    }
    return WhisperModelCache.instance;
  }
  
  async getWorker(): Promise<Worker> {
    if (this.worker && this.modelLoaded) {
      console.log('[WhisperCache] Returning cached worker');
      return this.worker;
    }
    
    if (this.loadingPromise) {
      console.log('[WhisperCache] Waiting for existing loading promise');
      await this.loadingPromise;
      return this.worker!;
    }
    
    console.log('[WhisperCache] Starting new worker initialization');
    this.loadingPromise = this.initializeWorker();
    
    // Persist loading promise globally
    if (typeof window !== 'undefined') {
      global.__WHISPER_LOADING_PROMISE__ = this.loadingPromise;
    }
    
    try {
      await this.loadingPromise;
      return this.worker!;
    } finally {
      // Clear global loading promise when done
      if (typeof window !== 'undefined') {
        global.__WHISPER_LOADING_PROMISE__ = undefined;
      }
    }
  }
  
  private async initializeWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create worker only once
        if (!this.worker) {
          console.log('[WhisperCache] Creating new worker instance');
          this.worker = new Worker(
            new URL('../workers/audioProcessingWorker.js', import.meta.url),
            { type: 'module' }
          );
          
          // Persist to global cache
          if (typeof window !== 'undefined') {
            global.__WHISPER_WORKER_INSTANCE__ = this.worker;
          }
          
          // Set up global message handler
          this.worker.onmessage = (event) => {
            // Handle model ready
            if (event.data.type === 'MODEL_READY') {
              this.modelLoaded = true;
              if (typeof window !== 'undefined') {
                global.__WHISPER_MODEL_LOADED__ = true;
              }
              console.log('[WhisperCache] Model loaded successfully');
              resolve();
            }
            
            // Forward to all listeners - use a copy to prevent modification during iteration
            const listenersCopy = Array.from(this.listeners);
            // Use setTimeout to prevent stack overflow from recursive calls
            setTimeout(() => {
              listenersCopy.forEach(listener => {
                try {
                  listener(event);
                } catch (error) {
                  console.error('[WhisperCache] Error in listener:', error);
                }
              });
            }, 0);
          };
          
          this.worker.onerror = (error) => {
            console.error('[WhisperCache] Worker error:', error);
            // Attempt to recover by recreating the worker
            this.attemptRecovery();
            reject(error);
          };
          
          // Check if model already loaded from cache
          if (this.modelLoaded) {
            console.log('[WhisperCache] Model already loaded, skipping init');
            resolve();
          } else {
            // Initialize the model
            console.log('[WhisperCache] Initializing model in worker');
            this.worker.postMessage({ type: 'INIT' });
          }
        } else {
          // Worker already exists
          console.log('[WhisperCache] Worker already exists');
          if (this.modelLoaded) {
            resolve();
          } else {
            // Wait for model to load
            const checkReady = () => {
              if (this.modelLoaded) {
                resolve();
              } else {
                setTimeout(checkReady, 100);
              }
            };
            checkReady();
          }
        }
      } catch (error) {
        console.error('[WhisperCache] Failed to initialize worker:', error);
        reject(error);
      }
    });
  }
  
  addMessageListener(listener: (event: MessageEvent) => void): () => void {
    this.listeners.add(listener);
    // Return cleanup function
    return () => {
      this.listeners.delete(listener);
    };
  }

  sendMessage(message: any, transfer?: Transferable[]) {
    if (!this.worker) throw new Error('Worker not initialized');
    this.worker.postMessage(message, transfer || []);
  }
  
  isModelLoaded(): boolean {
    return this.modelLoaded;
  }
  
  // Attempt to recover from worker failure
  private attemptRecovery(): void {
    console.log('[WhisperCache] Attempting worker recovery...');
    
    // Clean up current worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.modelLoaded = false;
    this.loadingPromise = null;
    
    // Clear global cache
    if (typeof window !== 'undefined') {
      global.__WHISPER_WORKER_INSTANCE__ = undefined;
      global.__WHISPER_MODEL_LOADED__ = undefined;
      global.__WHISPER_LOADING_PROMISE__ = undefined;
    }
    
    // Attempt to reinitialize after a brief delay
    setTimeout(() => {
      console.log('[WhisperCache] Reinitializing worker after failure...');
      this.getWorker().catch(error => {
        console.error('[WhisperCache] Recovery failed:', error);
      });
    }, 1000);
  }
  
  // Clean up method (for testing or manual cleanup)
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.modelLoaded = false;
    this.loadingPromise = null;
    this.listeners.clear();
    
    // Clear global cache
    if (typeof window !== 'undefined') {
      global.__WHISPER_WORKER_INSTANCE__ = undefined;
      global.__WHISPER_MODEL_LOADED__ = undefined;
      global.__WHISPER_LOADING_PROMISE__ = undefined;
    }
  }
}

export const whisperModelCache = WhisperModelCache.getInstance();