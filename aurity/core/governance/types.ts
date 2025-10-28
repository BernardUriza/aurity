// =============================================================================
// AURITY FRAMEWORK - Governance Types
// =============================================================================
// RBAC, authentication, and authorization types
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

/**
 * User roles in the system
 */
export enum UserRole {
  /** Omnipotent admin - full access to everything */
  ADMIN = 'admin',

  /** Compliance officer - audit and reporting access */
  COMPLIANCE = 'compliance',

  /** Medical professional - clinical data access */
  MEDICO = 'medico',

  /** External auditor - read-only temporary access */
  AUDITOR = 'auditor',

  /** Regular user - limited access */
  USER = 'user',
}

/**
 * Permissions for different actions
 */
export enum Permission {
  // Read permissions
  READ_ALL = 'read:all',
  READ_USERS = 'read:users',
  READ_LOGS = 'read:logs',
  READ_STORAGE = 'read:storage',
  READ_CONFIG = 'read:config',

  // Write permissions
  WRITE_ALL = 'write:all',
  WRITE_USERS = 'write:users',
  WRITE_STORAGE = 'write:storage',
  WRITE_CONFIG = 'write:config',

  // Delete permissions
  DELETE_ALL = 'delete:all',
  DELETE_USERS = 'delete:users',
  DELETE_STORAGE = 'delete:storage',

  // Admin permissions
  MANAGE_ROLES = 'manage:roles',
  MANAGE_PERMISSIONS = 'manage:permissions',
  MANAGE_SYSTEM = 'manage:system',

  // Audit permissions
  VIEW_AUDIT_LOGS = 'view:audit_logs',
  EXPORT_DATA = 'export:data',
}

/**
 * User information
 */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  active: boolean;
  createdAt: Date;
  lastLogin?: Date;
  metadata?: Record<string, any>;
}

/**
 * Authentication session
 */
export interface AuthSession {
  sessionId: string;
  userId: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login result
 */
export interface LoginResult {
  success: boolean;
  session?: AuthSession;
  user?: User;
  token?: string;
  error?: string;
}

/**
 * Auth context for requests
 */
export interface AuthContext {
  user: User;
  session: AuthSession;
  permissions: Permission[];
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
  userPermissions?: Permission[];
}

/**
 * Role configuration
 */
export interface RoleConfig {
  role: UserRole;
  permissions: Permission[];
  description: string;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  success: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Role permissions mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin has ALL permissions
    Permission.READ_ALL,
    Permission.WRITE_ALL,
    Permission.DELETE_ALL,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_PERMISSIONS,
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_DATA,
  ],

  [UserRole.COMPLIANCE]: [
    Permission.READ_ALL,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_DATA,
  ],

  [UserRole.MEDICO]: [
    Permission.READ_USERS,
    Permission.READ_STORAGE,
    Permission.WRITE_STORAGE,
  ],

  [UserRole.AUDITOR]: [
    Permission.READ_LOGS,
    Permission.VIEW_AUDIT_LOGS,
  ],

  [UserRole.USER]: [
    Permission.READ_STORAGE,
  ],
};
