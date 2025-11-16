// =============================================================================
// Auth Login API - POST /api/auth/login
// =============================================================================
// Handles user authentication and returns JWT token
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthManager } from '@/aurity/core/governance';

export const runtime = 'nodejs';

interface LoginRequest {
  email: string;
  password: string;
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get auth manager
    const authManager = getAuthManager();

    // Attempt login
    const result = await authManager.login(
      {
        email: body.email,
        password: body.password,
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Authentication Failed', message: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Return token and user info
    return NextResponse.json(
      {
        success: true,
        token: result.token,
        user: result.user,
        session: {
          sessionId: result.session!.sessionId,
          expiresAt: result.session!.expiresAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
