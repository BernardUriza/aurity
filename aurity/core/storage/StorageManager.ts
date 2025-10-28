// =============================================================================
// AURITY FRAMEWORK - Storage Manager
// =============================================================================
// Manages temporary buffers without PHI data
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  StorageBuffer,
  BufferType,
  StorageManifest,
  ManifestEntry,
  EntryStatus,
  StorageConfig,
  StorageResult,
  CleanupOptions,
  CleanupResult,
  StorageStats,
  BufferMetadata,
  IntegrityCheck,
} from './types';

/**
 * StorageManager - Handles temporary non-PHI data storage
 *
 * Key principles:
 * - NO PHI data (Protected Health Information)
 * - Temporary buffers with TTL
 * - Cryptographic integrity (SHA256)
 * - Automatic cleanup
 * - Manifest-based tracking
 */
export class StorageManager {
  private config: StorageConfig;
  private manifest: StorageManifest | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      baseDir: config.baseDir || '/tmp/aurity/storage',
      maxBufferSize: config.maxBufferSize || 10 * 1024 * 1024, // 10MB
      maxTotalSize: config.maxTotalSize || 100 * 1024 * 1024, // 100MB
      defaultTTL: config.defaultTTL || 3600, // 1 hour
      cleanupInterval: config.cleanupInterval || 300, // 5 minutes
      enableCompression: config.enableCompression ?? false,
      enableEncryption: config.enableEncryption ?? false,
    };
  }

  /**
   * Initialize storage system
   */
  async initialize(): Promise<StorageResult<void>> {
    try {
      // Create base directory
      await fs.mkdir(this.config.baseDir, { recursive: true });

      // Create subdirectories
      await fs.mkdir(path.join(this.config.baseDir, 'buffers'), { recursive: true });
      await fs.mkdir(path.join(this.config.baseDir, 'manifests'), { recursive: true });

      // Load or create manifest
      await this.loadManifest();

      // Start cleanup timer
      this.startCleanupTimer();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Store a buffer (NO PHI!)
   */
  async storeBuffer(
    type: BufferType,
    data: Buffer | string,
    metadata: BufferMetadata,
    ttl?: number
  ): Promise<StorageResult<StorageBuffer>> {
    try {
      // Validate size
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      if (dataBuffer.length > this.config.maxBufferSize) {
        return {
          success: false,
          error: `Buffer size ${dataBuffer.length} exceeds max ${this.config.maxBufferSize}`,
        };
      }

      // Generate unique ID
      const id = this.generateId();

      // Calculate hash
      const hash = this.calculateHash(dataBuffer);

      // Create buffer object
      const now = new Date();
      const buffer: StorageBuffer = {
        id,
        type,
        data: dataBuffer,
        metadata: {
          ...metadata,
          size: dataBuffer.length,
          checksum: hash,
        },
        createdAt: now,
        expiresAt: new Date(now.getTime() + (ttl || this.config.defaultTTL) * 1000),
        hash,
      };

      // Write buffer to disk
      const bufferPath = this.getBufferPath(id);
      await fs.writeFile(bufferPath, dataBuffer);

      // Update manifest
      await this.addToManifest(buffer);

      return {
        success: true,
        data: {
          ...buffer,
          data: '[STORED]', // Don't return data in result
        } as any,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve a buffer by ID
   */
  async getBuffer(id: string): Promise<StorageResult<StorageBuffer>> {
    try {
      // Find in manifest
      const entry = this.manifest?.buffers.find((b) => b.bufferId === id);
      if (!entry) {
        return { success: false, error: 'Buffer not found' };
      }

      // Check if expired
      if (new Date() > new Date(entry.expiresAt)) {
        return { success: false, error: 'Buffer expired' };
      }

      // Read from disk
      const bufferPath = this.getBufferPath(id);
      const data = await fs.readFile(bufferPath);

      // Verify integrity
      const hash = this.calculateHash(data);
      if (hash !== entry.hash) {
        // Mark as corrupted
        entry.status = EntryStatus.CORRUPTED;
        await this.saveManifest();

        return { success: false, error: 'Buffer integrity check failed' };
      }

      const buffer: StorageBuffer = {
        id: entry.bufferId,
        type: entry.type,
        data,
        metadata: entry.metadata,
        createdAt: new Date(entry.createdAt),
        expiresAt: new Date(entry.expiresAt),
        hash: entry.hash,
      };

      return { success: true, data: buffer };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a buffer
   */
  async deleteBuffer(id: string): Promise<StorageResult<void>> {
    try {
      // Remove from disk
      const bufferPath = this.getBufferPath(id);
      await fs.unlink(bufferPath).catch(() => {}); // Ignore if doesn't exist

      // Update manifest
      if (this.manifest) {
        this.manifest.buffers = this.manifest.buffers.filter((b) => b.bufferId !== id);
        this.manifest.updatedAt = new Date();
        await this.saveManifest();
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cleanup expired buffers
   */
  async cleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
    const startTime = Date.now();
    const result: CleanupResult = {
      buffersRemoved: 0,
      spaceFreed: 0,
      errors: [],
      duration: 0,
    };

    if (!this.manifest) {
      return result;
    }

    const now = new Date();
    const cutoffDate = options.olderThan || now;

    for (const entry of this.manifest.buffers) {
      // Skip if not matching criteria
      if (options.types && !options.types.includes(entry.type)) {
        continue;
      }

      // Check if expired or older than cutoff
      const shouldRemove =
        options.force ||
        new Date(entry.expiresAt) < now ||
        new Date(entry.createdAt) < cutoffDate;

      if (shouldRemove) {
        if (!options.dryRun) {
          const deleteResult = await this.deleteBuffer(entry.bufferId);
          if (deleteResult.success) {
            result.buffersRemoved++;
            result.spaceFreed += entry.size;
          } else {
            result.errors.push(`Failed to delete ${entry.bufferId}: ${deleteResult.error}`);
          }
        } else {
          // Dry run - just count
          result.buffersRemoved++;
          result.spaceFreed += entry.size;
        }
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    const stats: StorageStats = {
      totalBuffers: 0,
      totalSize: 0,
      byType: {} as Record<BufferType, number>,
      oldestBuffer: null,
      newestBuffer: null,
      utilizationPercentage: 0,
    };

    if (!this.manifest) {
      return stats;
    }

    stats.totalBuffers = this.manifest.buffers.filter(
      (b) => b.status === EntryStatus.ACTIVE
    ).length;
    stats.totalSize = this.manifest.totalSize;

    // Group by type
    for (const entry of this.manifest.buffers) {
      if (entry.status === EntryStatus.ACTIVE) {
        stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;

        const createdAt = new Date(entry.createdAt);
        if (!stats.oldestBuffer || createdAt < stats.oldestBuffer) {
          stats.oldestBuffer = createdAt;
        }
        if (!stats.newestBuffer || createdAt > stats.newestBuffer) {
          stats.newestBuffer = createdAt;
        }
      }
    }

    stats.utilizationPercentage = (stats.totalSize / this.config.maxTotalSize) * 100;

    return stats;
  }

  /**
   * Verify integrity of all buffers
   */
  async verifyIntegrity(): Promise<IntegrityCheck> {
    const check: IntegrityCheck = {
      timestamp: new Date(),
      totalEntries: 0,
      validEntries: 0,
      corruptedEntries: 0,
      missingEntries: 0,
      overallHash: '',
    };

    if (!this.manifest) {
      return check;
    }

    check.totalEntries = this.manifest.buffers.length;
    const hashes: string[] = [];

    for (const entry of this.manifest.buffers) {
      try {
        const bufferPath = this.getBufferPath(entry.bufferId);
        const data = await fs.readFile(bufferPath);
        const hash = this.calculateHash(data);

        if (hash === entry.hash) {
          check.validEntries++;
          hashes.push(hash);
        } else {
          check.corruptedEntries++;
          entry.status = EntryStatus.CORRUPTED;
        }
      } catch (error) {
        check.missingEntries++;
        entry.status = EntryStatus.CORRUPTED;
      }
    }

    // Calculate overall hash
    check.overallHash = this.calculateHash(Buffer.from(hashes.join('')));

    await this.saveManifest();
    return check;
  }

  /**
   * Shutdown storage system
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    await this.saveManifest();
  }

  // =========================================================================
  // Private methods
  // =========================================================================

  private async loadManifest(): Promise<void> {
    const manifestPath = path.join(this.config.baseDir, 'manifests', 'current.json');

    try {
      const data = await fs.readFile(manifestPath, 'utf-8');
      this.manifest = JSON.parse(data);
    } catch (error) {
      // Create new manifest
      this.manifest = {
        id: this.generateId(),
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        buffers: [],
        totalSize: 0,
        integrityCheck: {
          timestamp: new Date(),
          totalEntries: 0,
          validEntries: 0,
          corruptedEntries: 0,
          missingEntries: 0,
          overallHash: '',
        },
      };
      await this.saveManifest();
    }
  }

  private async saveManifest(): Promise<void> {
    if (!this.manifest) return;

    const manifestPath = path.join(this.config.baseDir, 'manifests', 'current.json');
    this.manifest.updatedAt = new Date();

    // Calculate total size
    this.manifest.totalSize = this.manifest.buffers.reduce(
      (sum, b) => sum + (b.status === EntryStatus.ACTIVE ? b.size : 0),
      0
    );

    await fs.writeFile(manifestPath, JSON.stringify(this.manifest, null, 2));
  }

  private async addToManifest(buffer: StorageBuffer): Promise<void> {
    if (!this.manifest) return;

    const entry: ManifestEntry = {
      bufferId: buffer.id,
      type: buffer.type,
      hash: buffer.hash,
      size: buffer.metadata.size,
      createdAt: buffer.createdAt,
      expiresAt: buffer.expiresAt,
      metadata: buffer.metadata,
      status: EntryStatus.ACTIVE,
    };

    this.manifest.buffers.push(entry);
    await this.saveManifest();
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(console.error);
    }, this.config.cleanupInterval * 1000);
  }

  private getBufferPath(id: string): string {
    return path.join(this.config.baseDir, 'buffers', `${id}.buf`);
  }

  private generateId(): string {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  private calculateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// Export singleton instance
let storageManagerInstance: StorageManager | null = null;

export function getStorageManager(config?: Partial<StorageConfig>): StorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager(config);
  }
  return storageManagerInstance;
}

export function resetStorageManager(): void {
  if (storageManagerInstance) {
    storageManagerInstance.shutdown().catch(console.error);
    storageManagerInstance = null;
  }
}
