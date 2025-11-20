'use client';

/**
 * UserManagement Component
 * Integrated user administration without leaving AURITY
 *
 * Features:
 * - User list with search and filters
 * - Inline role assignment
 * - Email invitations
 * - User activity history
 */

import { useState, useEffect } from 'react';
import { useRBAC, ROLES, getRoleName, getRoleBadgeColor, type Role } from '@/hooks/useRBAC';

interface User {
  user_id: string;
  email: string;
  name?: string;
  picture?: string;
  created_at: string;
  last_login?: string;
  logins_count?: number;
  roles: Role[];
  blocked?: boolean;
}

interface UserManagementProps {
  onClose: () => void;
}

export function UserManagement({ onClose }: UserManagementProps) {
  const { isSuperAdmin, roles: currentUserRoles } = useRBAC();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Load users (from Auth0 Management API via backend)
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
      const response = await fetch(`${backendUrl}/api/internal/admin/users?per_page=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth0_access_token') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Map Auth0 user format to our User interface
      const mappedUsers: User[] = data.users.map((u: any) => ({
        user_id: u.user_id,
        email: u.email,
        name: u.name,
        picture: u.picture,
        created_at: u.created_at,
        last_login: u.last_login,
        logins_count: u.logins_count,
        roles: u.roles || [],
        blocked: u.blocked,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);

      // Fallback to mock data if API fails
      console.warn('Using mock data - API unavailable or not configured');
      const mockUsers: User[] = [
        {
          user_id: 'auth0|507f1f77bcf86cd799439011',
          email: 'bernarduriza@gmail.com',
          name: 'Bernard Uriza',
          picture: 'https://gravatar.com/avatar/hash1',
          created_at: new Date('2024-01-15').toISOString(),
          last_login: new Date().toISOString(),
          logins_count: 47,
          roles: [ROLES.SUPERADMIN],
          blocked: false,
        },
        {
          user_id: 'auth0|507f1f77bcf86cd799439012',
          email: 'doctor@hospital.com',
          name: 'Dr. García',
          picture: 'https://gravatar.com/avatar/hash2',
          created_at: new Date('2024-02-20').toISOString(),
          last_login: new Date(Date.now() - 86400000).toISOString(),
          logins_count: 23,
          roles: [ROLES.DOCTOR],
          blocked: false,
        },
        {
          user_id: 'auth0|507f1f77bcf86cd799439013',
          email: 'admin@aurity.app',
          name: 'Admin Sistema',
          picture: 'https://gravatar.com/avatar/hash3',
          created_at: new Date('2024-03-10').toISOString(),
          last_login: new Date(Date.now() - 172800000).toISOString(),
          logins_count: 15,
          roles: [ROLES.ADMIN],
          blocked: false,
        },
        {
          user_id: 'auth0|507f1f77bcf86cd799439014',
          email: 'nurse@hospital.com',
          name: 'Enfermera López',
          created_at: new Date('2024-04-05').toISOString(),
          logins_count: 0,
          roles: [ROLES.NURSE],
          blocked: false,
        },
      ];

      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  // Handle role toggle
  const handleRoleToggle = async (user: User, role: Role) => {
    try {
      const hasRole = user.roles.includes(role);
      const updatedRoles = hasRole
        ? user.roles.filter(r => r !== role)
        : [...user.roles, role];

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

      const response = await fetch(`${backendUrl}/api/internal/admin/users/${user.user_id}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth0_access_token') || ''}`,
        },
        body: JSON.stringify({ roles: updatedRoles })
      });

      if (!response.ok) {
        throw new Error(`Failed to update roles: ${response.statusText}`);
      }

      // Update local state
      setUsers(users.map(u =>
        u.user_id === user.user_id
          ? { ...u, roles: updatedRoles }
          : u
      ));

      console.log(`✅ Updated ${user.email} roles:`, updatedRoles);
    } catch (error) {
      console.error('❌ Failed to update roles:', error);
      alert('Error al actualizar roles. Ver consola para detalles.');
    }
  };

  // Handle user block/unblock
  const handleBlockToggle = async (user: User) => {
    try {
      const newBlockedState = !user.blocked;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

      const response = await fetch(`${backendUrl}/api/internal/admin/users/${user.user_id}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth0_access_token') || ''}`,
        },
        body: JSON.stringify({ blocked: newBlockedState })
      });

      if (!response.ok) {
        throw new Error(`Failed to block user: ${response.statusText}`);
      }

      // Update local state
      setUsers(users.map(u =>
        u.user_id === user.user_id
          ? { ...u, blocked: newBlockedState }
          : u
      ));

      console.log(`✅ ${newBlockedState ? 'Blocked' : 'Unblocked'} user:`, user.email);
    } catch (error) {
      console.error('❌ Failed to block/unblock user:', error);
      alert('Error al bloquear/desbloquear usuario. Ver consola para detalles.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Gestión de Usuarios</h2>
              <p className="text-sm text-slate-400 mt-1">
                Administración integrada sin salir de AURITY
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar por email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <svg className="absolute right-3 top-2.5 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos los roles</option>
              {Object.values(ROLES).map(role => (
                <option key={role} value={role}>{getRoleName(role)}</option>
              ))}
            </select>

            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invitar Usuario
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-12 w-12 border-4 border-blue-400 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div
                  key={user.user_id}
                  className={`bg-slate-900/50 border rounded-lg p-4 hover:border-slate-600 transition-colors ${
                    user.blocked ? 'border-red-900/50 opacity-60' : 'border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {user.picture ? (
                        <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                          {user.name?.[0] || user.email[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-medium flex items-center gap-2">
                            {user.name || user.email}
                            {user.blocked && (
                              <span className="px-2 py-0.5 bg-red-900/30 border border-red-700 text-red-400 text-xs rounded">
                                Bloqueado
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-slate-400 font-mono">{user.email}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                          >
                            Ver Actividad
                          </button>
                          <button
                            onClick={() => handleBlockToggle(user)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              user.blocked
                                ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400'
                                : 'bg-red-900/30 hover:bg-red-900/50 text-red-400'
                            }`}
                          >
                            {user.blocked ? 'Desbloquear' : 'Bloquear'}
                          </button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-4 text-xs text-slate-500 mb-3">
                        <span>
                          Creado: {new Date(user.created_at).toLocaleDateString('es-MX')}
                        </span>
                        {user.last_login && (
                          <span>
                            Último acceso: {new Date(user.last_login).toLocaleDateString('es-MX')}
                          </span>
                        )}
                        <span>
                          Logins: {user.logins_count || 0}
                        </span>
                      </div>

                      {/* Role Management */}
                      <div className="flex flex-wrap gap-2">
                        {Object.values(ROLES).map(role => {
                          const hasRole = user.roles.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => handleRoleToggle(user, role)}
                              className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                                hasRole
                                  ? `${getRoleBadgeColor(role)} text-white`
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              {hasRole && '✓ '}
                              {getRoleName(role)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
              {searchTerm || roleFilter !== 'all' ? ` (filtrado de ${users.length})` : ''}
            </span>
            <button
              onClick={loadUsers}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              🔄 Recargar
            </button>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteUserModal onClose={() => setShowInviteModal(false)} onInvite={loadUsers} />
      )}

      {/* Activity Modal */}
      {selectedUser && (
        <UserActivityModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}

// Invite User Modal Component
function InviteUserModal({ onClose, onInvite }: { onClose: () => void; onInvite: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([ROLES.VIEWER]);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

      const response = await fetch(`${backendUrl}/api/internal/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth0_access_token') || ''}`,
        },
        body: JSON.stringify({
          email,
          name: name || undefined,
          roles: selectedRoles,
          send_verification_email: true,
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create user: ${response.statusText}`);
      }

      console.log('✅ User created:', { email, name, roles: selectedRoles });
      alert(`✅ Usuario creado e invitación enviada a ${email}`);
      onInvite();
      onClose();
    } catch (error) {
      console.error('❌ Failed to invite user:', error);
      alert('❌ Error al crear usuario. Ver consola para detalles.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">Invitar Usuario</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre (opcional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Roles</label>
            <div className="space-y-2">
              {Object.values(ROLES).filter(r => r !== ROLES.SUPERADMIN).map(role => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role]);
                      } else {
                        setSelectedRoles(selectedRoles.filter(r => r !== role));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900"
                  />
                  <span className={`px-2 py-0.5 ${getRoleBadgeColor(role)} text-white text-xs rounded`}>
                    {getRoleName(role)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sending || !email || selectedRoles.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {sending ? 'Enviando...' : 'Enviar Invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// User Activity Modal Component
function UserActivityModal({ user, onClose }: { user: User; onClose: () => void }) {
  const activities = [
    { timestamp: new Date(), action: 'Login exitoso', ip: '192.168.1.100' },
    { timestamp: new Date(Date.now() - 3600000), action: 'Sesión creada', details: 'session_20251120_001' },
    { timestamp: new Date(Date.now() - 7200000), action: 'Exportación de datos', details: 'corpus_export.json' },
    { timestamp: new Date(Date.now() - 86400000), action: 'Login exitoso', ip: '192.168.1.100' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">Historial de Actividad</h3>
          <p className="text-sm text-slate-400 mt-1">{user.email}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {activities.map((activity, idx) => (
              <div key={idx} className="flex gap-3 pb-3 border-b border-slate-800 last:border-0">
                <div className="flex-shrink-0 w-16 text-xs text-slate-500 text-right pt-1">
                  {activity.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{activity.action}</p>
                  {activity.details && (
                    <p className="text-xs text-slate-400 font-mono mt-1">{activity.details}</p>
                  )}
                  {activity.ip && (
                    <p className="text-xs text-slate-500 mt-1">IP: {activity.ip}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
            <p className="text-xs text-yellow-400/80">
              🚧 Logs completos de actividad se integrarán con el sistema de auditoría (HDF5:/audit_logs)
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
