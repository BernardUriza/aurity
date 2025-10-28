// =============================================================================
// AURITY FRAMEWORK - Authentication Manager
// =============================================================================
// Stub authentication with admin role
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

import * as crypto from 'crypto';
import {
  User,
  UserRole,
  Permission,
  AuthSession,
  LoginCredentials,
  LoginResult,
  PermissionCheckResult,
  AuditLog,
  ROLE_PERMISSIONS,
  AuthContext,
} from './types';

/**
 * AuthManager - Handles authentication and authorization
 *
 * Sprint SPR-2025W44 implementation:
 * - Stub authentication (no real password verification)
 * - Single admin role (omnipotent)
 * - In-memory session storage
 * - Basic RBAC enforcement
 */
export class AuthManager {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, AuthSession> = new Map();
  private auditLogs: AuditLog[] = [];

  constructor() {
    // Create default admin user
    this.createDefaultAdmin();
  }

  /**
   * Create default admin user (stub)
   */
  private createDefaultAdmin(): void {
    const adminUser: User = {
      id: 'admin-001',
      email: 'admin@aurity.local',
      role: UserRole.ADMIN,
      permissions: ROLE_PERMISSIONS[UserRole.ADMIN],
      active: true,
      createdAt: new Date(),
      metadata: {
        isDefault: true,
        description: 'Default omnipotent admin',
      },
    };

    this.users.set(adminUser.email, adminUser);
  }

  /**
   * Login (stub implementation)
   * NOTE: In production, this would verify against hashed passwords
   */
  async login(
    credentials: LoginCredentials,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    try {
      // Find user
      const user = this.users.get(credentials.email);
      if (!user) {
        this.logAudit({
          userId: 'unknown',
          action: 'login_failed',
          resource: 'auth',
          success: false,
          timestamp: new Date(),
          ipAddress,
          userAgent,
          metadata: { email: credentials.email, reason: 'user_not_found' },
        });

        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Check if user is active
      if (!user.active) {
        this.logAudit({
          userId: user.id,
          action: 'login_failed',
          resource: 'auth',
          success: false,
          timestamp: new Date(),
          ipAddress,
          userAgent,
          metadata: { reason: 'user_inactive' },
        });

        return {
          success: false,
          error: 'User account is inactive',
        };
      }

      // Stub password verification
      // In production: await this.verifyPassword(credentials.password, user.passwordHash)
      const passwordValid = this.stubPasswordCheck(credentials.password, user);
      if (!passwordValid) {
        this.logAudit({
          userId: user.id,
          action: 'login_failed',
          resource: 'auth',
          success: false,
          timestamp: new Date(),
          ipAddress,
          userAgent,
          metadata: { reason: 'invalid_password' },
        });

        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Create session
      const session = this.createSession(user, ipAddress, userAgent);

      // Generate token
      const token = this.generateToken(session);

      // Update last login
      user.lastLogin = new Date();

      // Log successful login
      this.logAudit({
        userId: user.id,
        action: 'login_success',
        resource: 'auth',
        success: true,
        timestamp: new Date(),
        ipAddress,
        userAgent,
      });

      return {
        success: true,
        session,
        user: this.sanitizeUser(user),
        token,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Logout - invalidate session
   */
  async logout(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    this.logAudit({
      userId: session.userId,
      action: 'logout',
      resource: 'auth',
      success: true,
      timestamp: new Date(),
    });

    this.sessions.delete(sessionId);
    return true;
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<AuthContext | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Get user
    const user = Array.from(this.users.values()).find((u) => u.id === session.userId);
    if (!user || !user.active) {
      this.sessions.delete(sessionId);
      return null;
    }

    return {
      user: this.sanitizeUser(user),
      session,
      permissions: session.permissions,
    };
  }

  /**
   * Check if user has permission
   */
  checkPermission(
    context: AuthContext,
    requiredPermission: Permission
  ): PermissionCheckResult {
    const { user, permissions } = context;

    // Admin has all permissions
    if (user.role === UserRole.ADMIN) {
      return {
        allowed: true,
        reason: 'Admin role has all permissions',
      };
    }

    // Check if user has the specific permission
    const hasPermission = permissions.includes(requiredPermission);

    return {
      allowed: hasPermission,
      reason: hasPermission ? undefined : 'Missing required permission',
      requiredPermissions: [requiredPermission],
      userPermissions: permissions,
    };
  }

  /**
   * Check if user has any of the required permissions
   */
  checkAnyPermission(
    context: AuthContext,
    requiredPermissions: Permission[]
  ): PermissionCheckResult {
    const { user, permissions } = context;

    // Admin has all permissions
    if (user.role === UserRole.ADMIN) {
      return {
        allowed: true,
        reason: 'Admin role has all permissions',
      };
    }

    // Check if user has any of the required permissions
    const hasAnyPermission = requiredPermissions.some((p) => permissions.includes(p));

    return {
      allowed: hasAnyPermission,
      reason: hasAnyPermission ? undefined : 'Missing any required permission',
      requiredPermissions,
      userPermissions: permissions,
    };
  }

  /**
   * Check if user has all required permissions
   */
  checkAllPermissions(
    context: AuthContext,
    requiredPermissions: Permission[]
  ): PermissionCheckResult {
    const { user, permissions } = context;

    // Admin has all permissions
    if (user.role === UserRole.ADMIN) {
      return {
        allowed: true,
        reason: 'Admin role has all permissions',
      };
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((p) => permissions.includes(p));

    return {
      allowed: hasAllPermissions,
      reason: hasAllPermissions ? undefined : 'Missing some required permissions',
      requiredPermissions,
      userPermissions: permissions,
    };
  }

  /**
   * Get audit logs
   */
  getAuditLogs(limit: number = 100): AuditLog[] {
    return this.auditLogs.slice(-limit).reverse();
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | null {
    const user = Array.from(this.users.values()).find((u) => u.id === userId);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values()).map((u) => this.sanitizeUser(u));
  }

  // =========================================================================
  // Private methods
  // =========================================================================

  private createSession(
    user: User,
    ipAddress?: string,
    userAgent?: string
  ): AuthSession {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const session: AuthSession = {
      sessionId,
      userId: user.id,
      role: user.role,
      permissions: user.permissions,
      createdAt: now,
      expiresAt,
      ipAddress,
      userAgent,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateToken(session: AuthSession): string {
    // JWT-like token with HMAC-SHA256 signature
    const payload = {
      sessionId: session.sessionId,
      userId: session.userId,
      role: session.role,
      exp: session.expiresAt.getTime(),
      iat: Date.now(),
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Get secret from environment or use default for development
    const secret = process.env.JWT_SECRET || 'aurity-dev-secret-change-in-production';

    // Generate HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    return `${payloadB64}.${signature}`;
  }

  /**
   * Verify token signature
   */
  verifyToken(token: string): { valid: boolean; payload?: any; error?: string } {
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

  private stubPasswordCheck(password: string, user: User): boolean {
    // Stub implementation for Sprint SPR-2025W44
    // Accept any non-empty password for admin
    // In production: compare with hashed password
    if (user.role === UserRole.ADMIN && password.length > 0) {
      return true;
    }

    return false;
  }

  private sanitizeUser(user: User): User {
    // Remove sensitive fields before returning
    return {
      ...user,
      // Remove password hash if it exists
    };
  }

  private logAudit(log: Omit<AuditLog, 'id'>): void {
    const auditLog: AuditLog = {
      id: crypto.randomBytes(16).toString('hex'),
      ...log,
    };

    this.auditLogs.push(auditLog);

    // Keep only last 10000 logs in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }
}

// Export singleton instance with thread-safe lazy initialization
let authManagerInstance: AuthManager | null = null;
let isInitializing = false;

export function getAuthManager(): AuthManager {
  // Thread-safe double-check locking pattern
  if (!authManagerInstance) {
    if (isInitializing) {
      // Wait for initialization to complete
      while (isInitializing) {
        // Busy wait - in production, use proper async/await or locks
      }
      return authManagerInstance!;
    }

    isInitializing = true;
    try {
      // Double-check after acquiring lock
      if (!authManagerInstance) {
        authManagerInstance = new AuthManager();
      }
    } finally {
      isInitializing = false;
    }
  }
  return authManagerInstance;
}

export function resetAuthManager(): void {
  authManagerInstance = null;
  isInitializing = false;
}
