# Storage Module - Local Storage Sin PHI

> **⚠️ IMPORTANTE: Este módulo NO debe almacenar PHI (Protected Health Information)**

## Overview

Sistema de almacenamiento temporal para datos no sensibles con las siguientes características:

- ✅ **Sin PHI:** Solo datos IoT, métricas, logs de sistema
- ✅ **Buffers Temporales:** TTL configurablecon cleanup automático
- ✅ **Integridad Criptográfica:** SHA256 hashing para todos los buffers
- ✅ **Manifest Tracking:** Registro de todos los archivos almacenados
- ✅ **Auto-cleanup:** Limpieza automática de buffers expirados

## Architecture

```
aurity/core/storage/
├── types.ts              # Type definitions
├── StorageManager.ts     # Main storage class
├── index.ts              # Module exports
└── README.md             # This file
```

## Usage

### Initialize Storage

```typescript
import { getStorageManager, BufferType } from '@/aurity/core/storage';

// Get singleton instance
const storage = getStorageManager({
  baseDir: '/tmp/aurity/storage',
  maxBufferSize: 10 * 1024 * 1024, // 10MB
  maxTotalSize: 100 * 1024 * 1024, // 100MB
  defaultTTL: 3600, // 1 hour
  cleanupInterval: 300, // 5 minutes
});

// Initialize
await storage.initialize();
```

### Store Buffer

```typescript
// Example: Store temperature sensor data
const result = await storage.storeBuffer(
  BufferType.TEMPERATURE,
  Buffer.from(JSON.stringify({ value: 23.5, unit: 'celsius' })),
  {
    source: 'sensor-001',
    timestamp: Date.now(),
    size: 0, // Will be calculated
    tags: ['refrigerator', 'vaccines'],
  },
  3600 // TTL in seconds
);

if (result.success) {
  console.log('Buffer stored:', result.data?.id);
}
```

### Retrieve Buffer

```typescript
const result = await storage.getBuffer(bufferId);

if (result.success) {
  const buffer = result.data;
  console.log('Buffer type:', buffer.type);
  console.log('Data:', buffer.data.toString());
  console.log('Hash:', buffer.hash);
}
```

### Delete Buffer

```typescript
await storage.deleteBuffer(bufferId);
```

### Cleanup Expired Buffers

```typescript
// Manual cleanup
const cleanupResult = await storage.cleanup({
  force: false,
  dryRun: false,
  olderThan: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
  types: [BufferType.TEMP_BUFFER],
});

console.log(`Removed ${cleanupResult.buffersRemoved} buffers`);
console.log(`Freed ${cleanupResult.spaceFreed} bytes`);
```

### Get Storage Statistics

```typescript
const stats = await storage.getStats();

console.log('Total buffers:', stats.totalBuffers);
console.log('Total size:', stats.totalSize);
console.log('Utilization:', stats.utilizationPercentage + '%');
console.log('By type:', stats.byType);
```

### Verify Integrity

```typescript
const integrity = await storage.verifyIntegrity();

console.log('Total entries:', integrity.totalEntries);
console.log('Valid entries:', integrity.validEntries);
console.log('Corrupted entries:', integrity.corruptedEntries);
console.log('Missing entries:', integrity.missingEntries);
console.log('Overall hash:', integrity.overallHash);
```

## Buffer Types (NO PHI)

```typescript
enum BufferType {
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
```

## Manifest Structure

El manifest (`current.json`) contiene:

```json
{
  "id": "1730088000000-a1b2c3d4e5f6g7h8",
  "version": "1.0",
  "createdAt": "2025-10-28T00:00:00.000Z",
  "updatedAt": "2025-10-28T01:00:00.000Z",
  "buffers": [
    {
      "bufferId": "1730088000000-a1b2c3d4",
      "type": "temperature",
      "hash": "7a3c4e2f9b1d8a5e...",
      "size": 1024,
      "createdAt": "2025-10-28T00:00:00.000Z",
      "expiresAt": "2025-10-28T01:00:00.000Z",
      "metadata": {
        "source": "sensor-001",
        "timestamp": 1730088000000,
        "size": 1024,
        "tags": ["refrigerator"]
      },
      "status": "active"
    }
  ],
  "totalSize": 1024,
  "integrityCheck": {
    "timestamp": "2025-10-28T01:00:00.000Z",
    "totalEntries": 1,
    "validEntries": 1,
    "corruptedEntries": 0,
    "missingEntries": 0,
    "overallHash": "b8e4f2a9c1d7..."
  }
}
```

## Security Considerations

### ✅ Allowed Data

- IoT sensor readings (temperature, humidity, motion)
- Equipment status and calibration data
- System logs and metrics
- Access logs (without personal identifiers)
- Generic temporary buffers

### ❌ FORBIDDEN Data (PHI)

- **Patient information**
- **Medical records**
- **Audio/video of consultations**
- **Personal identifiers (names, IDs, etc.)**
- **Clinical notes**
- **Prescriptions**
- **Lab results with patient data**

## Configuration

```typescript
interface StorageConfig {
  baseDir: string; // Base directory for storage
  maxBufferSize: number; // Max size per buffer (bytes)
  maxTotalSize: number; // Max total storage (bytes)
  defaultTTL: number; // Default time-to-live (seconds)
  cleanupInterval: number; // Auto-cleanup interval (seconds)
  enableCompression: boolean; // Enable compression
  enableEncryption: boolean; // Enable encryption
}
```

## Error Handling

```typescript
const result = await storage.storeBuffer(/* ... */);

if (!result.success) {
  console.error('Storage error:', result.error);
  // Handle error appropriately
}
```

## Best Practices

1. **Always set appropriate TTL** - Don't store data longer than needed
2. **Use specific buffer types** - Helps with cleanup and organization
3. **Monitor storage stats** - Check utilization regularly
4. **Verify integrity periodically** - Run integrity checks
5. **Never store PHI** - Triple-check data before storing

## Examples

### Example 1: Temperature Sensor (FI-Cold Module)

```typescript
// Store temperature reading
const tempData = {
  sensorId: 'FRIDGE-001',
  temperature: 4.2,
  unit: 'celsius',
  timestamp: Date.now(),
};

await storage.storeBuffer(
  BufferType.TEMPERATURE,
  Buffer.from(JSON.stringify(tempData)),
  {
    source: 'fi-cold-module',
    timestamp: Date.now(),
    size: 0,
    tags: ['refrigerator', 'vaccines', 'critical'],
  },
  600 // 10 minutes TTL
);
```

### Example 2: Access Log (FI-Entry Module)

```typescript
// Store access event (no personal data)
const accessEvent = {
  eventType: 'door_open',
  location: 'main_entrance',
  timestamp: Date.now(),
  duration: 5, // seconds
};

await storage.storeBuffer(
  BufferType.ACCESS_LOG,
  Buffer.from(JSON.stringify(accessEvent)),
  {
    source: 'fi-entry-module',
    timestamp: Date.now(),
    size: 0,
    tags: ['security', 'access-control'],
  },
  3600 // 1 hour TTL
);
```

## Sprint SPR-2025W44 Compliance

✅ **Sin cámaras** - No video storage
✅ **Sin PHI** - No protected health information
✅ **Sin modo offline** - Network-dependent only

---

**Version:** 0.1.0
**Sprint:** SPR-2025W44
**Last Updated:** 2025-10-28
