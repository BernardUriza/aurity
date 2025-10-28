/**
 * Whisper Utilities
 * 
 * Enhanced utility functions for Whisper model management with caching and progress feedback
 * Based on whisper.cpp common utility patterns for medical AI transcription
 */

// IndexedDB configuration for model caching
const DB_NAME = 'whisper-models-cache';
const DB_VERSION = 1;
const STORE_NAME = 'models';

// Model size mappings (in MB) for progress estimation
const MODEL_SIZES = {
  'tiny': 39,
  'tiny.en': 39,
  'base': 74,
  'base.en': 74,
  'small': 244,
  'small.en': 244,
  'medium': 769,
  'medium.en': 769,
  'large-v1': 1550,
  'large-v2': 1550,
  'large-v3': 1550,
  'large': 1550
};

/**
 * Convert typed arrays between different formats
 */
function convertTypedArray(src, type) {
  var buffer = new ArrayBuffer(src.byteLength);
  new src.constructor(buffer).set(src);
  return new type(buffer);
}

/**
 * Print function for logging with textarea output support
 */
var printTextarea = (function() {
  var element = document.getElementById('whisper-output');
  if (element) element.value = ''; // clear browser cache
  return function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
    console.log('Whisper:', text);
    if (element) {
      element.value += text + "\n";
      element.scrollTop = element.scrollHeight; // focus on bottom
    }
  };
})();

/**
 * Clear model cache
 */
async function clearCache() {
  if (confirm('Are you sure you want to clear the Whisper model cache?\nAll models will be downloaded again.')) {
    try {
      await new Promise((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase(DB_NAME);
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => reject(deleteReq.error);
        deleteReq.onblocked = () => reject(new Error('Database deletion blocked'));
      });
      console.log('Whisper model cache cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }
  return false;
}

/**
 * Fetch remote file with progress tracking
 */
async function fetchRemote(url, cbProgress, cbPrint) {
  cbPrint('fetchRemote: downloading with fetch()...');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });

  if (!response.ok) {
    cbPrint('fetchRemote: failed to fetch ' + url);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = parseInt(contentLength, 10);
  const reader = response.body.getReader();

  var chunks = [];
  var receivedLength = 0;
  var progressLast = -1;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    if (contentLength) {
      const progress = receivedLength / total;
      cbProgress(progress);

      var progressCur = Math.round(progress * 10);
      if (progressCur != progressLast) {
        cbPrint(`fetchRemote: fetching ${progressCur * 10}% ... (${Math.round(receivedLength / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB)`);
        progressLast = progressCur;
      }
    }
  }

  var position = 0;
  var chunksAll = new Uint8Array(receivedLength);

  for (var chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }

  return chunksAll;
}

/**
 * Get model size estimation
 */
function getModelSize(modelName) {
  // Extract model type from filename or path
  const modelType = modelName.replace(/^.*ggml-/, '').replace(/\.bin$/, '');
  return MODEL_SIZES[modelType] || 150; // Default 150MB if unknown
}

/**
 * Check storage quota and usage
 */
async function checkStorageQuota() {
  if (!navigator.storage || !navigator.storage.estimate) {
    console.warn('Storage API not supported');
    return { quota: 0, usage: 0, available: 0 };
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      quota: estimate.quota || 0,
      usage: estimate.usage || 0,
      available: (estimate.quota || 0) - (estimate.usage || 0)
    };
  } catch (error) {
    console.error('Failed to check storage quota:', error);
    return { quota: 0, usage: 0, available: 0 };
  }
}

/**
 * Load remote model with caching and progress feedback
 */
function loadRemote(url, dst, size_mb, cbProgress, cbReady, cbCancel, cbPrint) {
  if (!navigator.storage || !navigator.storage.estimate) {
    cbPrint('loadRemote: navigator.storage.estimate() is not supported');
  } else {
    // Query the storage quota and print it
    navigator.storage.estimate().then(function (estimate) {
      cbPrint('loadRemote: storage quota: ' + Math.round((estimate.quota || 0) / 1024 / 1024) + ' MB');
      cbPrint('loadRemote: storage usage: ' + Math.round((estimate.usage || 0) / 1024 / 1024) + ' MB');
      
      const availableSpace = (estimate.quota || 0) - (estimate.usage || 0);
      const requiredSpace = size_mb * 1024 * 1024;
      
      if (availableSpace < requiredSpace) {
        cbPrint(`loadRemote: insufficient storage space. Required: ${size_mb}MB, Available: ${Math.round(availableSpace / 1024 / 1024)}MB`);
        cbCancel();
        return;
      }
    });
  }

  // Check if the data is already in the IndexedDB
  var rq = indexedDB.open(DB_NAME, DB_VERSION);

  rq.onupgradeneeded = function (event) {
    var db = event.target.result;
    if (db.version == 1) {
      var os = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      os.createIndex('timestamp', 'timestamp', { unique: false });
      cbPrint('loadRemote: created IndexedDB ' + db.name + ' version ' + db.version);
    } else {
      // Clear the database on version upgrade
      var os = event.currentTarget.transaction.objectStore(STORE_NAME);
      os.clear();
      cbPrint('loadRemote: cleared IndexedDB ' + db.name + ' version ' + db.version);
    }
  };

  rq.onsuccess = function (event) {
    var db = event.target.result;
    var tx = db.transaction([STORE_NAME], 'readonly');
    var os = tx.objectStore(STORE_NAME);
    var rq = os.get(url);

    rq.onsuccess = function (_event) {
      if (rq.result) {
        cbPrint('loadRemote: "' + url + '" found in IndexedDB cache');
        cbPrint('loadRemote: cached on ' + new Date(rq.result.timestamp).toLocaleString());
        cbReady(dst, rq.result.data);
      } else {
        // Data is not in the IndexedDB
        cbPrint('loadRemote: "' + url + '" not found in cache');

        // Alert and ask the user to confirm
        const confirmMessage = 
          `Medical AI Model Download Required\n\n` +
          `Model: ${dst}\n` +
          `Size: ${size_mb} MB\n` +
          `Location: ${url}\n\n` +
          `This model will be cached in your browser for future use.\n` +
          `Download may take several minutes depending on your connection.\n\n` +
          `Press OK to download the model now.`;

        if (!confirm(confirmMessage)) {
          cbCancel();
          return;
        }

        // Show progress indicator
        cbPrint('loadRemote: starting download...');
        cbProgress(0);

        fetchRemote(url, cbProgress, cbPrint).then(function (data) {
          if (data) {
            cbPrint('loadRemote: download completed, storing in cache...');
            
            // Store the data in the IndexedDB
            var rq = indexedDB.open(DB_NAME, DB_VERSION);
            rq.onsuccess = function (event) {
              var db = event.target.result;
              var tx = db.transaction([STORE_NAME], 'readwrite');
              var os = tx.objectStore(STORE_NAME);

              const cacheEntry = {
                url: url,
                data: data,
                timestamp: Date.now(),
                size: data.byteLength,
                modelName: dst
              };

              var rq = null;
              try {
                rq = os.put(cacheEntry);
              } catch (e) {
                cbPrint('loadRemote: failed to store "' + url + '" in IndexedDB: \n' + e.message);
                cbCancel();
                return;
              }

              rq.onsuccess = function (_event) {
                cbPrint('loadRemote: "' + url + '" cached successfully');
                cbPrint('loadRemote: cache size: ' + Math.round(data.byteLength / 1024 / 1024) + ' MB');
                cbReady(dst, data);
              };

              rq.onerror = function (_event) {
                cbPrint('loadRemote: failed to cache "' + url + '": ' + event.target.error);
                // Still proceed with the data even if caching fails
                cbReady(dst, data);
              };
            };

            rq.onerror = function (event) {
              cbPrint('loadRemote: failed to open IndexedDB for caching: ' + event.target.error);
              // Still proceed with the data even if caching fails
              cbReady(dst, data);
            };
          }
        }).catch(function (error) {
          cbPrint('loadRemote: download failed: ' + error.message);
          cbCancel();
        });
      }
    };

    rq.onerror = function (event) {
      cbPrint('loadRemote: failed to query IndexedDB: ' + event.target.error);
      cbCancel();
    };
  };

  rq.onerror = function (event) {
    cbPrint('loadRemote: failed to open IndexedDB: ' + event.target.error);
    cbCancel();
  };

  rq.onblocked = function (_event) {
    cbPrint('loadRemote: IndexedDB access blocked');
    cbCancel();
  };

  rq.onabort = function (_event) {
    cbPrint('loadRemote: IndexedDB access aborted');
    cbCancel();
  };
}

/**
 * Get cached models information
 */
async function getCachedModels() {
  return new Promise((resolve, reject) => {
    const rq = indexedDB.open(DB_NAME, DB_VERSION);
    
    rq.onsuccess = function (event) {
      const db = event.target.result;
      const tx = db.transaction([STORE_NAME], 'readonly');
      const os = tx.objectStore(STORE_NAME);
      const rq = os.getAll();
      
      rq.onsuccess = function (event) {
        const models = event.target.result.map(entry => ({
          url: entry.url,
          modelName: entry.modelName,
          size: entry.size,
          timestamp: entry.timestamp,
          cached: new Date(entry.timestamp).toLocaleString()
        }));
        resolve(models);
      };
      
      rq.onerror = function (event) {
        reject(event.target.error);
      };
    };
    
    rq.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

/**
 * Remove specific model from cache
 */
async function removeFromCache(url) {
  return new Promise((resolve, reject) => {
    const rq = indexedDB.open(DB_NAME, DB_VERSION);
    
    rq.onsuccess = function (event) {
      const db = event.target.result;
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const os = tx.objectStore(STORE_NAME);
      const rq = os.delete(url);
      
      rq.onsuccess = function (_event) {
        console.log('Model removed from cache:', url);
        resolve(true);
      };
      
      rq.onerror = function (event) {
        reject(event.target.error);
      };
    };
    
    rq.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

/**
 * Create progress callback for UI integration
 */
function createProgressCallback(onProgress) {
  return function(progress) {
    if (typeof onProgress === 'function') {
      onProgress({
        progress: progress,
        percentage: Math.round(progress * 100),
        stage: progress < 1 ? 'downloading' : 'complete'
      });
    }
  };
}

/**
 * Create print callback for UI integration
 */
function createPrintCallback(onMessage) {
  return function(message) {
    console.log('Whisper:', message);
    if (typeof onMessage === 'function') {
      onMessage(message);
    }
  };
}

// Export all utility functions
export {
  convertTypedArray,
  printTextarea,
  clearCache,
  fetchRemote,
  loadRemote,
  getCachedModels,
  removeFromCache,
  checkStorageQuota,
  getModelSize,
  createProgressCallback,
  createPrintCallback,
  DB_NAME,
  DB_VERSION,
  STORE_NAME,
  MODEL_SIZES
};

// Default export with commonly used functions
export default {
  loadRemote,
  clearCache,
  getCachedModels,
  checkStorageQuota,
  getModelSize
};