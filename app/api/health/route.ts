// =============================================================================
// AURITY FRAMEWORK - Health Check Endpoint
// =============================================================================
// Simple health check endpoint for monitoring
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    sprint: 'SPR-2025W44',
    environment: process.env.NODE_ENV || 'development',
  });
}
