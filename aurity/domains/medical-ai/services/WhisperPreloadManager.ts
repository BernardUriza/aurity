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
  isLoading: boolean;
  isReady: boolean;
  progress: number;
  error: string | null;
  modelSize: ModelSize;
}

class WhisperPreloadManager {
  private status: PreloadStatus = {
    isLoading: false,
    isReady: false,
    progress: 0,
    error: null,
    modelSize: 'base',
  };

  /**
   * Preload Whisper model (no-op stub)
   */
  async preload(modelSize: ModelSize = 'base'): Promise<void> {
    this.status = {
      isLoading: true,
      isReady: false,
      progress: 0,
      error: null,
      modelSize,
    };

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 100));

    this.status = {
      isLoading: false,
      isReady: true,
      progress: 100,
      error: null,
      modelSize,
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
      isLoading: false,
      isReady: false,
      progress: 0,
      error: null,
      modelSize: 'base',
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
   * Initialize preload (alias for preload)
   */
  async initializePreload(modelSize: ModelSize = 'base'): Promise<void> {
    return this.preload(modelSize);
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
        isLoading: false,
        error: 'Preload cancelled',
      };
    }
  }
}

// Export singleton instance
export const whisperPreloadManager = new WhisperPreloadManager();
