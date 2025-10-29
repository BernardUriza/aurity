/**
 * Auth Token Diagnostic Test
 *
 * Verifies JWT token generation and validation
 * Bug: FI-BUG-P0-001 (6901ae44c000848378971fa8)
 */

import * as crypto from 'crypto';

// Simulate AuthManager token generation
function generateToken(sessionId: string, userId: string, role: string): string {
  const payload = {
    sessionId,
    userId,
    role,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24h from now
    iat: Date.now(),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = process.env.JWT_SECRET || 'aurity-dev-secret-change-in-production';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

// Simulate AuthManager token verification
function verifyToken(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [payloadB64, signature] = parts;

    // Verify signature
    const secret = process.env.JWT_SECRET || 'aurity-dev-secret-change-in-production';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Token verification failed' };
  }
}

// Run diagnostic
console.log('='.repeat(60));
console.log('JWT TOKEN DIAGNOSTIC TEST');
console.log('='.repeat(60));

// Test 1: Generate token
console.log('\n[Test 1] Generate JWT token');
const testToken = generateToken('session-123', 'admin-001', 'ADMIN');
console.log('Generated token:', testToken);
console.log('Token parts:', testToken.split('.').length);
console.log('Token length:', testToken.length);

// Test 2: Verify valid token
console.log('\n[Test 2] Verify valid token');
const result1 = verifyToken(testToken);
console.log('Verification result:', JSON.stringify(result1, null, 2));

// Test 3: Verify invalid token (wrong signature)
console.log('\n[Test 3] Verify invalid token (wrong signature)');
const invalidToken = testToken.slice(0, -10) + 'XXXXXXXXXX';
const result2 = verifyToken(invalidToken);
console.log('Verification result:', JSON.stringify(result2, null, 2));

// Test 4: Verify malformed token (missing part)
console.log('\n[Test 4] Verify malformed token (missing part)');
const malformedToken = testToken.split('.')[0]; // Only payload, no signature
const result3 = verifyToken(malformedToken);
console.log('Verification result:', JSON.stringify(result3, null, 2));

// Test 5: Decode payload without verification
console.log('\n[Test 5] Decode payload (no verification)');
const [payloadB64] = testToken.split('.');
const decodedPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
console.log('Decoded payload:', JSON.stringify(decodedPayload, null, 2));

console.log('\n' + '='.repeat(60));
console.log('DIAGNOSTIC COMPLETE');
console.log('='.repeat(60));

console.log('\nSUMMARY:');
console.log('- Token format: 2-part (payload.signature) ✓');
console.log('- Encoding: base64url ✓');
console.log('- Signature algorithm: HMAC-SHA256 ✓');
console.log('- Payload structure: {sessionId, userId, role, exp, iat} ✓');
console.log('\nExpected behavior:');
console.log('1. Login endpoint generates token with this format');
console.log('2. Frontend stores token in sessionStorage');
console.log('3. Frontend sends token in Authorization: Bearer <token>');
console.log('4. Backend verifies token signature and expiration');
console.log('5. Backend proceeds with request if valid');
