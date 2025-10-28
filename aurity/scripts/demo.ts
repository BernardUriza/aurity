#!/usr/bin/env ts-node
// =============================================================================
// AURITY FRAMEWORK - Demo Script
// =============================================================================
// Demonstrates 3 core cases: Verify, Store, Retrieve (V/A/R)
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

import { getStorageManager, BufferType, StorageConfig } from '../core/storage';
import { getAuthManager, UserRole, Permission } from '../core/governance';

// Demo configuration
const DEMO_CONFIG: Partial<StorageConfig> = {
  baseDir: '/tmp/aurity-demo/storage',
  maxBufferSize: 10 * 1024 * 1024, // 10MB
  defaultTTL: 3600, // 1 hour
  cleanupInterval: 300, // 5 minutes
};

// Synthetic dataset - IoT sensor readings (NO PHI)
const SYNTHETIC_DATA = {
  // FI-Cold: Temperature sensors in vaccine refrigerator
  temperatureSensors: [
    { sensorId: 'FRIDGE-001', location: 'Refrigerador Vacunas', temperature: 4.2, unit: 'celsius', timestamp: Date.now() },
    { sensorId: 'FRIDGE-001', location: 'Refrigerador Vacunas', temperature: 4.5, unit: 'celsius', timestamp: Date.now() + 60000 },
    { sensorId: 'FRIDGE-001', location: 'Refrigerador Vacunas', temperature: 3.8, unit: 'celsius', timestamp: Date.now() + 120000 },
  ],

  // FI-Cold: Humidity sensors
  humiditySensors: [
    { sensorId: 'HUM-001', location: 'Refrigerador Vacunas', humidity: 45.2, unit: 'percent', timestamp: Date.now() },
    { sensorId: 'HUM-001', location: 'Refrigerador Vacunas', humidity: 46.1, unit: 'percent', timestamp: Date.now() + 60000 },
  ],

  // FI-Entry: Access control events
  accessEvents: [
    { eventType: 'door_open', location: 'main_entrance', duration: 3, timestamp: Date.now() },
    { eventType: 'door_close', location: 'main_entrance', timestamp: Date.now() + 3000 },
    { eventType: 'motion_detected', location: 'corridor', timestamp: Date.now() + 10000 },
  ],

  // Equipment status
  equipmentStatus: [
    { equipmentId: 'AUTOCLAVE-001', status: 'operational', temperature: 121, pressure: 15, timestamp: Date.now() },
    { equipmentId: 'ECG-001', status: 'standby', battery: 87, lastCalibration: '2025-09-15', timestamp: Date.now() },
  ],
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper functions
function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function separator(char: string = '=', length: number = 80) {
  console.log(colors.cyan + char.repeat(length) + colors.reset);
}

function header(text: string) {
  separator();
  log(`  ${text}`, 'bright');
  separator();
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// CASO V: VERIFICAR (Verify) - Authentication & Integrity
// =============================================================================
async function casoVerificar() {
  header('CASO V: VERIFICAR - Authentication & Integrity');

  log('\n📋 Step 1: Initialize Authentication System', 'yellow');
  const authManager = getAuthManager();
  log('✅ AuthManager initialized', 'green');
  log(`   Default admin: admin@aurity.local`, 'cyan');

  await sleep(1000);

  log('\n📋 Step 2: Login as Admin (Omnipotent)', 'yellow');
  const loginResult = await authManager.login(
    {
      email: 'admin@aurity.local',
      password: 'demo-password',
    },
    '192.168.1.100',
    'Demo Script v0.1.0'
  );

  if (!loginResult.success) {
    log(`❌ Login failed: ${loginResult.error}`, 'red');
    process.exit(1);
  }

  log('✅ Login successful', 'green');
  log(`   User: ${loginResult.user?.email}`, 'cyan');
  log(`   Role: ${loginResult.user?.role}`, 'cyan');
  log(`   Permissions: ${loginResult.user?.permissions.length} total`, 'cyan');
  log(`   Token: ${loginResult.token?.substring(0, 32)}...`, 'cyan');

  await sleep(1000);

  log('\n📋 Step 3: Verify Admin Permissions', 'yellow');
  const session = loginResult.session!;
  const context = await authManager.validateSession(session.sessionId);

  if (!context) {
    log('❌ Session validation failed', 'red');
    process.exit(1);
  }

  const permissions = [
    Permission.READ_ALL,
    Permission.WRITE_ALL,
    Permission.DELETE_ALL,
    Permission.MANAGE_SYSTEM,
  ];

  for (const permission of permissions) {
    const check = authManager.checkPermission(context, permission);
    const status = check.allowed ? '✅' : '❌';
    const color = check.allowed ? 'green' : 'red';
    log(`   ${status} ${permission}`, color);
  }

  await sleep(1000);

  log('\n📋 Step 4: Review Audit Logs', 'yellow');
  const auditLogs = authManager.getAuditLogs(5);
  log(`✅ Retrieved ${auditLogs.length} audit logs`, 'green');

  auditLogs.forEach((log, index) => {
    console.log(
      `   ${index + 1}. [${log.timestamp.toISOString()}] ${log.userId} - ${log.action} - ${log.success ? 'SUCCESS' : 'FAILED'}`
    );
  });

  log('\n✨ CASO V COMPLETADO: Authentication & Audit Working', 'green');
  return context;
}

// =============================================================================
// CASO A: ALMACENAR (Store) - Storage System
// =============================================================================
async function casoAlmacenar(authContext: any) {
  header('CASO A: ALMACENAR - Storage System');

  log('\n📋 Step 1: Initialize Storage System', 'yellow');
  const storage = getStorageManager(DEMO_CONFIG);
  const initResult = await storage.initialize();

  if (!initResult.success) {
    log(`❌ Storage initialization failed: ${initResult.error}`, 'red');
    process.exit(1);
  }

  log('✅ Storage initialized', 'green');
  log(`   Base dir: ${DEMO_CONFIG.baseDir}`, 'cyan');
  log(`   Max buffer: ${(DEMO_CONFIG.maxBufferSize! / 1024 / 1024).toFixed(1)} MB`, 'cyan');
  log(`   Default TTL: ${DEMO_CONFIG.defaultTTL}s`, 'cyan');

  await sleep(1000);

  const storedBuffers: string[] = [];

  log('\n📋 Step 2: Store Temperature Sensor Data (FI-Cold)', 'yellow');
  for (const reading of SYNTHETIC_DATA.temperatureSensors) {
    const result = await storage.storeBuffer(
      BufferType.TEMPERATURE,
      Buffer.from(JSON.stringify(reading)),
      {
        source: 'fi-cold-module',
        timestamp: reading.timestamp,
        size: 0,
        tags: ['refrigerator', 'vaccines', 'critical'],
      },
      600 // 10 minutes TTL
    );

    if (result.success) {
      storedBuffers.push(result.data!.id);
      log(
        `   ✅ Stored: ${reading.sensorId} - ${reading.temperature}°C (ID: ${result.data!.id})`,
        'green'
      );
      log(`      Hash: ${result.data!.hash}`, 'cyan');
    } else {
      log(`   ❌ Failed to store: ${result.error}`, 'red');
    }
  }

  await sleep(1000);

  log('\n📋 Step 3: Store Humidity Sensor Data (FI-Cold)', 'yellow');
  for (const reading of SYNTHETIC_DATA.humiditySensors) {
    const result = await storage.storeBuffer(
      BufferType.HUMIDITY,
      Buffer.from(JSON.stringify(reading)),
      {
        source: 'fi-cold-module',
        timestamp: reading.timestamp,
        size: 0,
        tags: ['refrigerator', 'environmental'],
      },
      600
    );

    if (result.success) {
      storedBuffers.push(result.data!.id);
      log(
        `   ✅ Stored: ${reading.sensorId} - ${reading.humidity}% (ID: ${result.data!.id})`,
        'green'
      );
    }
  }

  await sleep(1000);

  log('\n📋 Step 4: Store Access Control Events (FI-Entry)', 'yellow');
  for (const event of SYNTHETIC_DATA.accessEvents) {
    const result = await storage.storeBuffer(
      BufferType.ACCESS_LOG,
      Buffer.from(JSON.stringify(event)),
      {
        source: 'fi-entry-module',
        timestamp: event.timestamp,
        size: 0,
        tags: ['security', 'access-control'],
      },
      3600
    );

    if (result.success) {
      storedBuffers.push(result.data!.id);
      log(
        `   ✅ Stored: ${event.eventType} at ${event.location} (ID: ${result.data!.id})`,
        'green'
      );
    }
  }

  await sleep(1000);

  log('\n📋 Step 5: Store Equipment Status', 'yellow');
  for (const status of SYNTHETIC_DATA.equipmentStatus) {
    const result = await storage.storeBuffer(
      BufferType.EQUIPMENT_STATUS,
      Buffer.from(JSON.stringify(status)),
      {
        source: 'fi-assets-module',
        timestamp: status.timestamp,
        size: 0,
        tags: ['equipment', 'monitoring'],
      },
      1800
    );

    if (result.success) {
      storedBuffers.push(result.data!.id);
      log(
        `   ✅ Stored: ${status.equipmentId} - ${status.status} (ID: ${result.data!.id})`,
        'green'
      );
    }
  }

  await sleep(1000);

  log('\n📋 Step 6: Review Storage Statistics', 'yellow');
  const stats = await storage.getStats();
  log(`✅ Storage Statistics:`, 'green');
  log(`   Total buffers: ${stats.totalBuffers}`, 'cyan');
  log(`   Total size: ${(stats.totalSize / 1024).toFixed(2)} KB`, 'cyan');
  log(`   Utilization: ${stats.utilizationPercentage.toFixed(2)}%`, 'cyan');
  log(`   By type:`, 'cyan');
  Object.entries(stats.byType).forEach(([type, count]) => {
    log(`      ${type}: ${count}`, 'cyan');
  });

  log('\n✨ CASO A COMPLETADO: All Data Stored Successfully', 'green');
  return storedBuffers;
}

// =============================================================================
// CASO R: RECUPERAR (Retrieve) - Retrieve & Validate
// =============================================================================
async function casoRecuperar(storedBuffers: string[]) {
  header('CASO R: RECUPERAR - Retrieve & Validate');

  const storage = getStorageManager();

  log('\n📋 Step 1: Retrieve First Buffer', 'yellow');
  const firstBufferId = storedBuffers[0];
  const retrieveResult = await storage.getBuffer(firstBufferId);

  if (!retrieveResult.success) {
    log(`❌ Failed to retrieve: ${retrieveResult.error}`, 'red');
  } else {
    const buffer = retrieveResult.data!;
    log(`✅ Buffer retrieved successfully`, 'green');
    log(`   ID: ${buffer.id}`, 'cyan');
    log(`   Type: ${buffer.type}`, 'cyan');
    log(`   Hash: ${buffer.hash}`, 'cyan');
    log(`   Created: ${buffer.createdAt.toISOString()}`, 'cyan');
    log(`   Expires: ${buffer.expiresAt.toISOString()}`, 'cyan');

    const data = JSON.parse(buffer.data.toString());
    log(`   Data: ${JSON.stringify(data, null, 2)}`, 'cyan');
  }

  await sleep(1000);

  log('\n📋 Step 2: Verify Integrity of All Buffers', 'yellow');
  const integrityCheck = await storage.verifyIntegrity();
  log(`✅ Integrity check completed`, 'green');
  log(`   Total entries: ${integrityCheck.totalEntries}`, 'cyan');
  log(`   Valid entries: ${integrityCheck.validEntries}`, 'green');
  log(`   Corrupted entries: ${integrityCheck.corruptedEntries}`, integrityCheck.corruptedEntries > 0 ? 'red' : 'cyan');
  log(`   Missing entries: ${integrityCheck.missingEntries}`, integrityCheck.missingEntries > 0 ? 'red' : 'cyan');
  log(`   Overall hash: ${integrityCheck.overallHash}`, 'cyan');

  await sleep(1000);

  log('\n📋 Step 3: Retrieve Multiple Buffers', 'yellow');
  let successCount = 0;
  let failCount = 0;

  for (const bufferId of storedBuffers.slice(0, 5)) {
    const result = await storage.getBuffer(bufferId);
    if (result.success) {
      successCount++;
      log(`   ✅ ${bufferId}: OK`, 'green');
    } else {
      failCount++;
      log(`   ❌ ${bufferId}: ${result.error}`, 'red');
    }
  }

  log(`\n   Retrieved ${successCount}/${storedBuffers.slice(0, 5).length} buffers successfully`, 'cyan');

  await sleep(1000);

  log('\n📋 Step 4: Test Buffer Deletion', 'yellow');
  const bufferToDelete = storedBuffers[storedBuffers.length - 1];
  const deleteResult = await storage.deleteBuffer(bufferToDelete);

  if (deleteResult.success) {
    log(`   ✅ Buffer deleted: ${bufferToDelete}`, 'green');

    // Try to retrieve deleted buffer
    const retrieveDeleted = await storage.getBuffer(bufferToDelete);
    if (!retrieveDeleted.success) {
      log(`   ✅ Confirmed: Buffer no longer accessible`, 'green');
    }
  } else {
    log(`   ❌ Delete failed: ${deleteResult.error}`, 'red');
  }

  await sleep(1000);

  log('\n📋 Step 5: Final Storage Statistics', 'yellow');
  const finalStats = await storage.getStats();
  log(`✅ Final Statistics:`, 'green');
  log(`   Total buffers: ${finalStats.totalBuffers}`, 'cyan');
  log(`   Total size: ${(finalStats.totalSize / 1024).toFixed(2)} KB`, 'cyan');
  log(`   Utilization: ${finalStats.utilizationPercentage.toFixed(2)}%`, 'cyan');

  log('\n✨ CASO R COMPLETADO: Retrieve & Validation Working', 'green');
}

// =============================================================================
// Main Demo Execution
// =============================================================================
async function main() {
  try {
    log('\n🚀 AURITY FRAMEWORK - Demo Script v0.1.0', 'bright');
    log('Sprint: SPR-2025W44', 'cyan');
    log('Demonstrating: Storage + RBAC + Integrity\n', 'cyan');

    await sleep(1000);

    // Execute the 3 cases
    const authContext = await casoVerificar();
    await sleep(2000);

    const storedBuffers = await casoAlmacenar(authContext);
    await sleep(2000);

    await casoRecuperar(storedBuffers);

    // Final summary
    separator('=');
    log('\n🎉 DEMO COMPLETADO CON ÉXITO', 'green');
    log('\nResumen:', 'bright');
    log('  ✅ Caso V: Authentication & Audit', 'green');
    log('  ✅ Caso A: Storage System', 'green');
    log('  ✅ Caso R: Retrieve & Validate', 'green');
    log('\n📊 Características Demostradas:', 'bright');
    log('  • RBAC con rol admin omnipotente', 'cyan');
    log('  • Storage de buffers temporales (sin PHI)', 'cyan');
    log('  • Hashing SHA256 para integridad', 'cyan');
    log('  • Manifest tracking', 'cyan');
    log('  • Audit logging', 'cyan');
    log('  • Permission checking', 'cyan');
    separator('=');

    log('\n✨ Ready for Phase 1 Module Development (FI-Cold, FI-Entry)\n', 'green');
  } catch (error) {
    log(`\n❌ Demo failed: ${error}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { main };
