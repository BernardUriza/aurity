# Governance Module - RBAC & Authentication

> **⚠️ SPRINT SPR-2025W44: Stub implementation for basic security**

## Overview

Sistema básico de autenticación y autorización con:

- ✅ **RBAC (Role-Based Access Control)**
- ✅ **Admin Omnipotente** - Rol con todos los permisos
- ✅ **Stub Authentication** - Auth local simplificado
- ✅ **Session Management** - Sesiones en memoria
- ✅ **Audit Logging** - Registro de acciones

## Architecture

```
aurity/core/governance/
├── types.ts           # Type definitions & permissions
├── AuthManager.ts     # Authentication & authorization
├── index.ts           # Module exports
└── README.md          # This file
```

## User Roles

```typescript
enum UserRole {
  ADMIN      = 'admin',      // Omnipotent - all permissions
  COMPLIANCE = 'compliance', // Audit & reporting
  MEDICO     = 'medico',     // Clinical data access
  AUDITOR    = 'auditor',    // Read-only temp access
  USER       = 'user',       // Limited access
}
```

## Permissions

### Admin (Omnipotent)
- `READ_ALL`, `WRITE_ALL`, `DELETE_ALL`
- `MANAGE_ROLES`, `MANAGE_PERMISSIONS`, `MANAGE_SYSTEM`
- `VIEW_AUDIT_LOGS`, `EXPORT_DATA`

### Compliance Officer
- `READ_ALL`
- `VIEW_AUDIT_LOGS`, `EXPORT_DATA`

### Medico
- `READ_USERS`, `READ_STORAGE`
- `WRITE_STORAGE`

### Auditor
- `READ_LOGS`
- `VIEW_AUDIT_LOGS`

### User
- `READ_STORAGE`

## Usage

### Initialize

```typescript
import { getAuthManager } from '@/aurity/core/governance';

const authManager = getAuthManager();
```

### Login (Stub)

```typescript
const result = await authManager.login(
  {
    email: 'admin@aurity.local',
    password: 'any-password', // Stub accepts any password
  },
  '192.168.1.1', // IP address
  'Mozilla/5.0...' // User agent
);

if (result.success) {
  console.log('Logged in as:', result.user?.email);
  console.log('Role:', result.user?.role);
  console.log('Token:', result.token);
  console.log('Session ID:', result.session?.sessionId);
}
```

### Validate Session

```typescript
const context = await authManager.validateSession(sessionId);

if (context) {
  console.log('User:', context.user.email);
  console.log('Role:', context.user.role);
  console.log('Permissions:', context.permissions);
}
```

### Check Permissions

```typescript
import { Permission } from '@/aurity/core/governance';

// Check single permission
const canDelete = authManager.checkPermission(
  context,
  Permission.DELETE_ALL
);

if (canDelete.allowed) {
  // Perform delete operation
} else {
  console.log('Access denied:', canDelete.reason);
}

// Check any of multiple permissions
const canReadOrWrite = authManager.checkAnyPermission(context, [
  Permission.READ_ALL,
  Permission.WRITE_ALL,
]);

// Check all permissions
const hasAllPerms = authManager.checkAllPermissions(context, [
  Permission.READ_USERS,
  Permission.WRITE_USERS,
]);
```

### Logout

```typescript
await authManager.logout(sessionId);
```

### Audit Logs

```typescript
const logs = authManager.getAuditLogs(50); // Last 50 logs

logs.forEach((log) => {
  console.log(`${log.timestamp}: ${log.userId} - ${log.action} - ${log.success}`);
});
```

## Default Admin User

The system creates a default admin on initialization:

```typescript
{
  id: 'admin-001',
  email: 'admin@aurity.local',
  role: UserRole.ADMIN,
  permissions: [ALL_PERMISSIONS],
  active: true
}
```

**Login:** Any non-empty password will work (stub implementation)

## Security Notes

### Sprint SPR-2025W44 Limitations

⚠️ **This is a STUB implementation:**
- No real password hashing (accepts any password for admin)
- Sessions stored in memory (lost on restart)
- No database persistence
- No password complexity requirements
- No rate limiting
- No MFA

### Production Requirements

For production, implement:
- [ ] Argon2id password hashing
- [ ] Database-backed user storage
- [ ] Persistent session storage (Redis)
- [ ] Password complexity validation
- [ ] Rate limiting on login attempts
- [ ] MFA (TOTP)
- [ ] Password reset flow
- [ ] Session rotation
- [ ] CSRF protection
- [ ] Brute-force protection

## Examples

### Example 1: Protected API Route

```typescript
import { getAuthManager, Permission } from '@/aurity/core/governance';

export async function GET(request: Request) {
  const authManager = getAuthManager();

  // Get session from header
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Decode token to get session ID (stub)
  const payload = JSON.parse(Buffer.from(token, 'base64').toString());
  const context = await authManager.validateSession(payload.sessionId);

  if (!context) {
    return Response.json({ error: 'Invalid session' }, { status: 401 });
  }

  // Check permission
  const canRead = authManager.checkPermission(context, Permission.READ_STORAGE);
  if (!canRead.allowed) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with request
  return Response.json({ data: 'sensitive data' });
}
```

### Example 2: Middleware Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthManager } from '@/aurity/core/governance';

export async function authMiddleware(
  request: NextRequest,
  requiredPermission?: Permission
) {
  const authManager = getAuthManager();

  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const context = await authManager.validateSession(payload.sessionId);

    if (!context) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (requiredPermission) {
      const check = authManager.checkPermission(context, requiredPermission);
      if (!check.allowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Add context to request
    (request as any).authContext = context;
    return null; // Continue
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

## API Reference

### AuthManager

#### `login(credentials, ipAddress?, userAgent?): Promise<LoginResult>`
Authenticate user and create session

#### `logout(sessionId): Promise<boolean>`
Invalidate session

#### `validateSession(sessionId): Promise<AuthContext | null>`
Validate and get auth context

#### `checkPermission(context, permission): PermissionCheckResult`
Check single permission

#### `checkAnyPermission(context, permissions): PermissionCheckResult`
Check if user has any of the permissions

#### `checkAllPermissions(context, permissions): PermissionCheckResult`
Check if user has all permissions

#### `getAuditLogs(limit?): AuditLog[]`
Get recent audit logs

#### `getUserById(userId): User | null`
Get user by ID

#### `getAllUsers(): User[]`
Get all users

---

**Version:** 0.1.0
**Sprint:** SPR-2025W44
**Status:** Stub Implementation
**Last Updated:** 2025-10-28
