/**
 * Whisper Preload Manager - Stub
 *
 * Stub temporal para compilación TypeScript.
 * TODO: Reemplazar por implementación real con preload de modelos Whisper.
 *
 * Gestiona la precarga de modelos Whisper para reducir latencia en transcripción.
 */

export type ModelSize = 'tiny' | 'base' | 'small' | 'medium' | 'large';

export interface PreloadStatus {
  status: 'idle' | 'loading' | 'loaded' | 'failed';
  isLoading: boolean;
  isReady: boolean;
  progress: number;
  error: string | null;
  modelSize: ModelSize;
  model?: any;
}

class WhisperPreloadManager {
  private status: PreloadStatus = {
    status: 'idle',
    isLoading: false,
    isReady: false,
    progress: 0,
    error: null,
    modelSize: 'base',
    model: null,
  };

  /**
   * Preload Whisper model (no-op stub)
   */
  async preload(modelSize: ModelSize = 'base'): Promise<void> {
    this.status = {
      status: 'loading',
      isLoading: true,
      isReady: false,
      progress: 0,
      error: null,
      modelSize,
      model: null,
    };

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 100));

    this.status = {
      status: 'loaded',
      isLoading: false,
      isReady: true,
      progress: 100,
      error: null,
      modelSize,
      model: {},
    };
  }

  /**
   * Get preload status
   */
  getStatus(): PreloadStatus {
    return { ...this.status };
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.status.isReady;
  }

  /**
   * Unload model
   */
  unload(): void {
    this.status = {
      status: 'idle',
      isLoading: false,
      isReady: false,
      progress: 0,
      error: null,
      modelSize: 'base',
      model: null,
    };
  }

  /**
   * Get state (alias for getStatus for compatibility)
   */
  getState(): PreloadStatus {
    return this.getStatus();
  }

  /**
   * Subscribe to status changes (stub - returns unsubscribe function)
   */
  subscribe(callback: (status: PreloadStatus) => void): () => void {
    // Stub: immediately call with current status, return no-op unsubscribe
    callback(this.getStatus());
    return () => {};
  }

  /**
   * Initialize preload with options (compat method)
   */
  async initializePreload(options?: { delay?: number; priority?: string } | ModelSize): Promise<void> {
    if (typeof options === 'string') {
      return this.preload(options);
    }
    return this.preload();
  }

  /**
   * Force preload even if already loaded
   */
  async forcePreload(modelSize: ModelSize = 'base'): Promise<void> {
    this.unload();
    return this.preload(modelSize);
  }

  /**
   * Cancel ongoing preload
   */
  cancel(): void {
    if (this.status.isLoading) {
      this.status = {
        ...this.status,
        status: 'failed',
        isLoading: false,
        error: 'Preload cancelled',
      };
    }
  }
}

// Export singleton instance
export const whisperPreloadManager = new WhisperPreloadManager();
