// =============================================================================
// AURITY FRAMEWORK - Storage Types
// =============================================================================
// Type definitions for storage system without PHI
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

/**
 * Storage buffer for temporary data (no PHI)
 * Data is stored temporarily for processing and then cleaned up
 */
export interface StorageBuffer {
  id: string;
  type: BufferType;
  data: Buffer | string;
  metadata: BufferMetadata;
  createdAt: Date;
  expiresAt: Date;
  hash: string;
}

/**
 * Types of buffers allowed (NO PHI)
 */
export enum BufferType {
  // IoT sensor data
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  MOTION = 'motion',
  ACCESS_LOG = 'access_log',

  // Equipment data
  EQUIPMENT_STATUS = 'equipment_status',
  CALIBRATION_DATA = 'calibration_data',

  // System data
  SYSTEM_LOG = 'system_log',
  METRICS = 'metrics',

  // Generic temporary buffer
  TEMP_BUFFER = 'temp_buffer',
}

/**
 * Metadata for buffer (NO PHI)
 */
export interface BufferMetadata {
  source: string;
  timestamp: number;
  size: number;
  mimeType?: string;
  tags?: string[];
  checksum?: string;
  version?: string;
}

/**
 * Manifest for tracking buffers and integrity
 */
export interface StorageManifest {
  id: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  buffers: ManifestEntry[];
  totalSize: number;
  integrityCheck: IntegrityCheck;
}

/**
 * Entry in manifest
 */
export interface ManifestEntry {
  bufferId: string;
  type: BufferType;
  hash: string;
  size: number;
  createdAt: Date;
  expiresAt: Date;
  metadata: BufferMetadata;
  status: EntryStatus;
}

/**
 * Status of manifest entry
 */
export enum EntryStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CLEANED = 'cleaned',
  CORRUPTED = 'corrupted',
}

/**
 * Integrity check result
 */
export interface IntegrityCheck {
  timestamp: Date;
  totalEntries: number;
  validEntries: number;
  corruptedEntries: number;
  missingEntries: number;
  overallHash: string;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  baseDir: string;
  maxBufferSize: number;
  maxTotalSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableCompression: boolean;
  enableEncryption: boolean;
}

/**
 * Storage operation result
 */
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Cleanup options
 */
export interface CleanupOptions {
  force?: boolean;
  dryRun?: boolean;
  olderThan?: Date;
  types?: BufferType[];
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  buffersRemoved: number;
  spaceFreed: number;
  errors: string[];
  duration: number;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalBuffers: number;
  totalSize: number;
  byType: Record<BufferType, number>;
  oldestBuffer: Date | null;
  newestBuffer: Date | null;
  utilizationPercentage: number;
}
