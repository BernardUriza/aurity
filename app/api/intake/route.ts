// =============================================================================
// AURITY FRAMEWORK - Intake Endpoint
// =============================================================================
// Validates minimal payload and forwards to FI-core /intake endpoint
// NO PHI in logs | Short timeout | Queued response on failure
// Sprint: SPR-2025W44 - Monorepo Integration
// Version: 0.1.0
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Types
// ============================================================================

interface IntakePayload {
  reason: string;
  symptoms: string;
}

interface IntakeResponse {
  success: boolean;
  message: string;
  queued?: boolean;
  error?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const FI_ENDPOINT_BASE = process.env.FI_ENDPOINT_BASE || 'http://localhost:7000';
const REQUEST_TIMEOUT_MS = 5000; // 5 seconds timeout

// ============================================================================
// Validation
// ============================================================================

function validatePayload(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length === 0) {
    return { valid: false, error: 'Field "reason" is required and must be a non-empty string' };
  }

  if (!body.symptoms || typeof body.symptoms !== 'string' || body.symptoms.trim().length === 0) {
    return { valid: false, error: 'Field "symptoms" is required and must be a non-empty string' };
  }

  return { valid: true };
}

// ============================================================================
// POST /api/intake
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate payload (NO PHI in logs)
    const validation = validatePayload(body);
    if (!validation.valid) {
      console.warn('[INTAKE] Validation failed - invalid payload structure');
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        } as IntakeResponse,
        { status: 400 }
      );
    }

    // Forward to FI-core /intake endpoint with timeout
    const fiEndpoint = `${FI_ENDPOINT_BASE}/intake`;

    console.info(`[INTAKE] Forwarding to FI-core: ${fiEndpoint}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(fiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: body.reason,
          symptoms: body.symptoms,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[INTAKE] FI-core responded with status ${response.status}`);

        // Return 202 Accepted (queued) without sensitive data
        return NextResponse.json(
          {
            success: false,
            message: 'Request queued for processing',
            queued: true,
          } as IntakeResponse,
          { status: 202 }
        );
      }

      const data = await response.json();

      console.info('[INTAKE] Successfully forwarded to FI-core');

      return NextResponse.json(
        {
          success: true,
          message: 'Intake processed successfully',
          ...data,
        } as IntakeResponse,
        { status: 200 }
      );

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        console.warn('[INTAKE] Request timeout - queuing for processing');
      } else {
        console.error('[INTAKE] FI-core connection failed (no sensitive data logged)');
      }

      // Return 202 Accepted (queued) - no sensitive data
      return NextResponse.json(
        {
          success: false,
          message: 'Request queued for processing',
          queued: true,
        } as IntakeResponse,
        { status: 202 }
      );
    }

  } catch (error: any) {
    console.error('[INTAKE] Unexpected error (no sensitive data logged)');

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as IntakeResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/intake (Method Not Allowed)
// ============================================================================

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to submit intake data.',
    } as IntakeResponse,
    { status: 405 }
  );
}
