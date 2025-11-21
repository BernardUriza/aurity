// =============================================================================
// PWA Module - Public API
// =============================================================================

// Storage utilities
export {
  STORES,
  dbGet,
  dbSet,
  dbDelete,
  dbGetAll,
  dbClear,
  queueAction,
  getQueuedActions,
  removeQueuedAction,
  clearQueue,
  cacheData,
  getCachedData,
  invalidateCache,
  setPreference,
  getPreference,
} from './storage';

export type { QueuedAction, CachedItem, UserPreference } from './storage';

// Sync manager
export {
  registerSyncHandler,
  processQueue,
  initSyncManager,
  requestBackgroundSync,
} from './sync';
