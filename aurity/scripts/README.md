# Aurity Demo Script - 3 Casos V/A/R

> **Sprint SPR-2025W44** - Demostración de Storage + RBAC + Integrity

## Overview

Script de demostración que muestra las capacidades del framework Aurity a través de 3 casos:

- **V (Verificar)**: Authentication & Audit
- **A (Almacenar)**: Storage System
- **R (Recuperar)**: Retrieve & Validate

## Casos Demostrados

### 📋 Caso V: VERIFICAR - Authentication & Integrity

Demuestra el sistema de autenticación y autorización RBAC:

1. **Initialize Authentication** - Setup del AuthManager
2. **Login as Admin** - Autenticación con rol omnipotente
3. **Verify Permissions** - Validación de permisos granulares
4. **Review Audit Logs** - Registro de todas las operaciones

**Características:**
- ✅ Rol ADMIN omnipotente
- ✅ 15 permisos granulares
- ✅ Session management
- ✅ Audit logging

### 📦 Caso A: ALMACENAR - Storage System

Demuestra el almacenamiento de datos IoT sin PHI:

1. **Initialize Storage** - Setup del StorageManager
2. **Store Temperature Data** - Sensores FI-Cold (refrigerador vacunas)
3. **Store Humidity Data** - Sensores ambientales FI-Cold
4. **Store Access Events** - Control de acceso FI-Entry
5. **Store Equipment Status** - Estado de equipos biomédicos
6. **Review Statistics** - Estadísticas de almacenamiento

**Características:**
- ✅ Buffers temporales con TTL
- ✅ SHA256 hashing
- ✅ Manifest tracking
- ✅ Multiple buffer types
- ✅ Storage statistics

### 🔍 Caso R: RECUPERAR - Retrieve & Validate

Demuestra la recuperación y validación de integridad:

1. **Retrieve Buffer** - Recuperar un buffer específico
2. **Verify Integrity** - Verificar todos los buffers
3. **Retrieve Multiple** - Recuperar múltiples buffers
4. **Test Deletion** - Eliminar y validar borrado
5. **Final Statistics** - Estadísticas finales

**Características:**
- ✅ Integridad criptográfica (SHA256)
- ✅ Validación de hashes
- ✅ Detection de corrupción
- ✅ CRUD operations

## Synthetic Dataset

El script utiliza datos sintéticos que representan escenarios reales **SIN PHI**:

### Temperature Sensors (FI-Cold)
```json
{
  "sensorId": "FRIDGE-001",
  "location": "Refrigerador Vacunas",
  "temperature": 4.2,
  "unit": "celsius",
  "timestamp": 1730088000000
}
```

### Humidity Sensors (FI-Cold)
```json
{
  "sensorId": "HUM-001",
  "location": "Refrigerador Vacunas",
  "humidity": 45.2,
  "unit": "percent",
  "timestamp": 1730088000000
}
```

### Access Events (FI-Entry)
```json
{
  "eventType": "door_open",
  "location": "main_entrance",
  "duration": 3,
  "timestamp": 1730088000000
}
```

### Equipment Status (FI-Assets)
```json
{
  "equipmentId": "AUTOCLAVE-001",
  "status": "operational",
  "temperature": 121,
  "pressure": 15,
  "timestamp": 1730088000000
}
```

## Prerequisites

```bash
# Node 20 LTS
node --version  # Should be 20.10.0+

# TypeScript & ts-node
npm install -g ts-node typescript

# Or use project dependencies
npm install
```

## Running the Demo

### Option 1: Using ts-node (Recommended)

```bash
# From project root
npx ts-node aurity/scripts/demo.ts
```

### Option 2: Compile and Run

```bash
# Compile TypeScript
npx tsc aurity/scripts/demo.ts --outDir dist

# Run compiled JavaScript
node dist/aurity/scripts/demo.js
```

### Option 3: NPM Script (Coming Soon)

```bash
npm run demo
```

## Expected Output

```
🚀 AURITY FRAMEWORK - Demo Script v0.1.0
Sprint: SPR-2025W44
Demonstrating: Storage + RBAC + Integrity

================================================================================
  CASO V: VERIFICAR - Authentication & Integrity
================================================================================

📋 Step 1: Initialize Authentication System
✅ AuthManager initialized
   Default admin: admin@aurity.local

📋 Step 2: Login as Admin (Omnipotent)
✅ Login successful
   User: admin@aurity.local
   Role: admin
   Permissions: 8 total
   Token: eyJzZXNzaW9uSWQiOiI3YTNjNGU...

📋 Step 3: Verify Admin Permissions
   ✅ read:all
   ✅ write:all
   ✅ delete:all
   ✅ manage:system

📋 Step 4: Review Audit Logs
✅ Retrieved 2 audit logs
   1. [2025-10-28T...] admin-001 - login_success - SUCCESS
   2. [2025-10-28T...] unknown - login_failed - FAILED

✨ CASO V COMPLETADO: Authentication & Audit Working

[... continues with Caso A and Caso R ...]

================================================================================

🎉 DEMO COMPLETADO CON ÉXITO

Resumen:
  ✅ Caso V: Authentication & Audit
  ✅ Caso A: Storage System
  ✅ Caso R: Retrieve & Validate

📊 Características Demostradas:
  • RBAC con rol admin omnipotente
  • Storage de buffers temporales (sin PHI)
  • Hashing SHA256 para integridad
  • Manifest tracking
  • Audit logging
  • Permission checking

================================================================================

✨ Ready for Phase 1 Module Development (FI-Cold, FI-Entry)
```

## Storage Location

Demo data is stored temporarily at:
```
/tmp/aurity-demo/storage/
├── buffers/          # Buffer files (.buf)
└── manifests/        # Manifest files (current.json)
```

**Note:** Data is automatically cleaned up after TTL expires (10-60 minutes depending on type)

## What This Demo Shows

### ✅ Security Features
- RBAC with admin omnipotent role
- Permission-based access control
- Session management with expiration
- Audit logging of all operations

### ✅ Storage Features
- Temporary buffer storage (no PHI)
- SHA256 cryptographic hashing
- Manifest-based tracking
- Integrity verification
- Auto-cleanup with TTL
- Multiple buffer types support

### ✅ Compliance
- NO PHI data stored
- All data has TTL (auto-deletion)
- Cryptographic integrity verification
- Audit trail for accountability

## Troubleshooting

### Error: Cannot find module '@/aurity/core/storage'

Make sure you're running from the project root and TypeScript paths are configured.

**Solution:**
```bash
# Check tsconfig.json has paths configured
cd /path/to/aurity
npx ts-node -r tsconfig-paths/register aurity/scripts/demo.ts
```

### Error: EACCES: permission denied '/tmp/aurity-demo'

The demo needs write access to /tmp.

**Solution:**
```bash
# Create directory with correct permissions
mkdir -p /tmp/aurity-demo
chmod 755 /tmp/aurity-demo
```

### Error: Module not found

Install dependencies:
```bash
npm install
```

## Extending the Demo

### Add New Buffer Type

```typescript
// In demo.ts, add to SYNTHETIC_DATA
calibrationData: [
  {
    equipmentId: 'ECG-001',
    calibrationDate: '2025-10-28',
    status: 'passed',
    technician: 'TECH-001', // No personal data
    timestamp: Date.now()
  }
]

// In casoAlmacenar(), add storage logic
await storage.storeBuffer(
  BufferType.CALIBRATION_DATA,
  Buffer.from(JSON.stringify(data)),
  metadata,
  ttl
);
```

### Add Permission Check

```typescript
// In casoVerificar(), add new permission
const canExport = authManager.checkPermission(
  context,
  Permission.EXPORT_DATA
);
log(`   ${canExport.allowed ? '✅' : '❌'} export:data`);
```

## Sprint SPR-2025W44 Compliance

✅ **Sin cámaras** - No video/image processing
✅ **Sin PHI** - Only IoT sensor data, no patient info
✅ **Sin modo offline** - Network-dependent storage

---

**Version:** 0.1.0
**Sprint:** SPR-2025W44
**Last Updated:** 2025-10-28
**Duration:** ~30 seconds
