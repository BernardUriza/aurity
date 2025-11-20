'use client';

/**
 * System Configuration Page
 * SUPERADMIN ONLY - Uses RBAC hook for access control
 *
 * Global system settings, user management, and role administration
 */

import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { configHeader } from '@/config/page-headers';
import { useRBAC, PERMISSIONS, getRoleName, getRoleBadgeColor, ROLES } from '@/hooks/useRBAC';
import { UserManagement } from '@/components/admin/UserManagement';

export default function ConfigPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const { isSuperAdmin, hasPermission, isLoading: rbacLoading, roles } = useRBAC();
  const router = useRouter();
  const [resettingOnboarding, setResettingOnboarding] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const isLoading = authLoading || rbacLoading;

  // Check superadmin access
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isSuperAdmin) {
      console.warn('[ConfigPage] Access denied - not superadmin');
      router.push('/unauthorized');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  // Handle onboarding reset
  const handleResetOnboarding = () => {
    if (!confirm('¿Estás seguro de que deseas reiniciar el onboarding? Esto eliminará todo el progreso guardado.')) {
      return;
    }

    setResettingOnboarding(true);

    try {
      // Clear onboarding localStorage
      localStorage.removeItem('fi_onboarding_progress');
      localStorage.removeItem('fi_onboarding_conversation');
      localStorage.removeItem('aurity_onboarding_completed');
      localStorage.removeItem('fi_onboarding_survey');

      console.log('✅ Onboarding reset successfully');

      // Show success and redirect after 1.5s
      setTimeout(() => {
        setResettingOnboarding(false);
        alert('✅ Onboarding reiniciado. Redirigiendo...');
        router.push('/onboarding');
      }, 1500);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
      alert('❌ Error al reiniciar onboarding. Ver consola.');
      setResettingOnboarding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return null; // Will redirect via useEffect
  }

  // Generate header config
  const headerConfig = configHeader();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Page Header */}
      <PageHeader {...headerConfig} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Superadmin Badge */}
        <div className="mb-6 bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-purple-300 font-medium">SUPERADMIN Access</span>
            <span className="text-purple-400/60 text-sm">·</span>
            <span className="text-purple-400/80 text-sm">{user?.email}</span>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-6">
          {/* System Settings */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Sistema</h2>
              <p className="text-sm text-slate-400">Configuración global del sistema</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div>
                  <p className="text-white font-medium">Modo de Mantenimiento</p>
                  <p className="text-sm text-slate-400">Bloquear acceso para usuarios no-admin</p>
                </div>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                  Desactivado
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div>
                  <p className="text-white font-medium">Logs del Sistema</p>
                  <p className="text-sm text-slate-400">Ver logs de errores y auditoría</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                  Ver Logs
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div>
                  <p className="text-white font-medium">Base de Datos</p>
                  <p className="text-sm text-slate-400">Estado de HDF5 corpus</p>
                </div>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                  Inspeccionar
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Reiniciar Onboarding</p>
                  <p className="text-sm text-slate-400">Resetear estado de onboarding para testing</p>
                </div>
                <button
                  onClick={handleResetOnboarding}
                  disabled={resettingOnboarding}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  {resettingOnboarding ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reseteando...
                    </>
                  ) : (
                    <>
                      🔄 Resetear
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Feature Flags</h2>
              <p className="text-sm text-slate-400">Activar/desactivar características experimentales</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div>
                  <p className="text-white font-medium">Demo Mode</p>
                  <p className="text-sm text-slate-400">Modo demo con TTS simulado</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm font-medium">Activo</span>
                  <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div>
                  <p className="text-white font-medium">Timeline View</p>
                  <p className="text-sm text-slate-400">Vista cronológica de eventos</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm font-medium">Activo</span>
                  <div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Advanced Diarization</p>
                  <p className="text-sm text-slate-400">Separación de voces mejorada</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm font-medium">Inactivo</span>
                  <div className="w-12 h-6 bg-slate-600 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Access */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Seguridad & Acceso</h2>
              <p className="text-sm text-slate-400">Gestión de roles y permisos</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div>
                  <p className="text-white font-medium">Usuarios Activos</p>
                  <p className="text-sm text-slate-400">Gestionar usuarios del sistema</p>
                </div>
                <button
                  onClick={() => setShowUserManagement(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  Gestionar Usuarios
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div>
                  <p className="text-white font-medium">Roles & Permisos</p>
                  <p className="text-sm text-slate-400">Configurar RBAC (Auth0)</p>
                </div>
                <button
                  onClick={() => setShowRolesModal(true)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
                >
                  Configurar
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Audit Trail</p>
                  <p className="text-sm text-slate-400">Registro completo de cambios</p>
                </div>
                <button
                  onClick={() => setShowAuditModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  Ver Auditoría
                </button>
              </div>
            </div>
          </div>

          {/* User & Role Management */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Gestión de Usuarios & Roles</h2>
              <p className="text-sm text-slate-400">Administración centralizada de permisos RBAC</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Current User Info */}
              <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Usuario Actual</h3>
                  {isSuperAdmin && (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                      SUPERADMIN
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white font-mono">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Auth0 Sub:</span>
                    <span className="text-slate-500 font-mono text-xs truncate max-w-xs">
                      {user?.sub}
                    </span>
                  </div>
                  <div className="flex items-start justify-between text-sm pt-2 border-t border-slate-700">
                    <span className="text-slate-400">Roles:</span>
                    <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                      {roles.length > 0 ? (
                        roles.map(role => (
                          <span
                            key={role}
                            className={`px-2 py-1 ${getRoleBadgeColor(role)} text-white text-xs font-medium rounded`}
                          >
                            {getRoleName(role)}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-xs">Sin roles asignados</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Roles Definition */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Roles Disponibles</h3>
                <div className="space-y-2">
                  {Object.entries(ROLES).map(([key, role]) => (
                    <div
                      key={role}
                      className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 ${getRoleBadgeColor(role)} text-white text-xs font-medium rounded`}>
                          {getRoleName(role)}
                        </span>
                        <span className="text-slate-400 text-sm font-mono">{role}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {role === ROLES.SUPERADMIN && 'Acceso completo al sistema'}
                        {role === ROLES.ADMIN && 'Administración general'}
                        {role === ROLES.DOCTOR && 'Operaciones clínicas'}
                        {role === ROLES.NURSE && 'Asistencia clínica'}
                        {role === ROLES.STAFF && 'Personal administrativo'}
                        {role === ROLES.VIEWER && 'Solo lectura'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permission Matrix */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Permisos por Rol</h3>
                <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 px-2 text-slate-400 font-medium">Permiso</th>
                        <th className="text-center py-2 px-2 text-purple-400 font-medium">SUPER</th>
                        <th className="text-center py-2 px-2 text-blue-400 font-medium">ADMIN</th>
                        <th className="text-center py-2 px-2 text-emerald-400 font-medium">DOCTOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-800">
                        <td className="py-2 px-2 text-slate-300">Gestionar Sistema</td>
                        <td className="text-center">✅</td>
                        <td className="text-center text-slate-600">—</td>
                        <td className="text-center text-slate-600">—</td>
                      </tr>
                      <tr className="border-b border-slate-800">
                        <td className="py-2 px-2 text-slate-300">Ver Logs</td>
                        <td className="text-center">✅</td>
                        <td className="text-center">✅</td>
                        <td className="text-center text-slate-600">—</td>
                      </tr>
                      <tr className="border-b border-slate-800">
                        <td className="py-2 px-2 text-slate-300">Gestionar Usuarios</td>
                        <td className="text-center">✅</td>
                        <td className="text-center text-slate-600">—</td>
                        <td className="text-center text-slate-600">—</td>
                      </tr>
                      <tr className="border-b border-slate-800">
                        <td className="py-2 px-2 text-slate-300">Crear Sesión</td>
                        <td className="text-center">✅</td>
                        <td className="text-center">✅</td>
                        <td className="text-center">✅</td>
                      </tr>
                      <tr className="border-b border-slate-800">
                        <td className="py-2 px-2 text-slate-300">Ver Sesión</td>
                        <td className="text-center">✅</td>
                        <td className="text-center">✅</td>
                        <td className="text-center">✅</td>
                      </tr>
                      <tr className="border-b border-slate-800">
                        <td className="py-2 px-2 text-slate-300">Exportar Datos</td>
                        <td className="text-center">✅</td>
                        <td className="text-center">✅</td>
                        <td className="text-center">✅</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-300">Eliminar Sesión</td>
                        <td className="text-center">✅</td>
                        <td className="text-center">✅</td>
                        <td className="text-center text-slate-600">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Superadmin Configuration */}
              <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Configuración Superadmin
                </h3>
                <p className="text-xs text-purple-400/80 mb-3">
                  Lista de emails con acceso completo al sistema (configurado via <code className="bg-purple-950/50 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPERADMIN_EMAILS</code>)
                </p>
                <div className="bg-slate-950/50 border border-purple-800/30 rounded p-3">
                  <code className="text-xs text-purple-300 font-mono">
                    NEXT_PUBLIC_SUPERADMIN_EMAILS=bernarduriza@gmail.com,admin@aurity.app
                  </code>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  ⚠️ Cambios requieren rebuild del frontend (pnpm build)
                </p>
              </div>

              {/* Auth0 Integration Note */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-300 mb-2">
                  🔗 Integración Auth0
                </h3>
                <p className="text-xs text-blue-400/80 mb-2">
                  Los roles se configuran en Auth0 Dashboard y se incluyen en el JWT token bajo el namespace:
                </p>
                <code className="block bg-slate-950/50 border border-blue-800/30 rounded p-2 text-xs text-blue-300 font-mono">
                  https://aurity.app/roles
                </code>
                <p className="text-xs text-slate-500 mt-2">
                  📚 Documentación: <a href="https://auth0.com/docs/manage-users/access-control/rbac" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Auth0 RBAC Guide</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {/* User Management - Full Featured */}
      {showUserManagement && (
        <UserManagement onClose={() => setShowUserManagement(false)} />
      )}

      {/* Roles Configuration Modal */}
      {showRolesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRolesModal(false)}>
          <div className="bg-slate-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Configurar Roles & Permisos</h2>
              <p className="text-sm text-slate-400 mt-1">Guía de configuración RBAC en Auth0</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-300 mb-2">🔧 Configuración en Auth0</h3>
                <ol className="text-xs text-slate-300 space-y-3 list-decimal list-inside">
                  <li>
                    <strong className="text-white">Crear Roles</strong>
                    <p className="text-slate-400 ml-5 mt-1">Auth0 Dashboard → User Management → Roles → Create Role</p>
                    <div className="ml-5 mt-2 bg-slate-950/50 p-2 rounded text-[10px] font-mono text-slate-400">
                      Nombres de roles: superadmin, admin, doctor, nurse, staff, viewer
                    </div>
                  </li>
                  <li>
                    <strong className="text-white">Configurar Actions (JWT customization)</strong>
                    <p className="text-slate-400 ml-5 mt-1">Actions → Flows → Login → Create Custom Action</p>
                    <div className="ml-5 mt-2 bg-slate-950/50 p-3 rounded">
                      <pre className="text-[10px] text-green-400 overflow-x-auto">
{`exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://aurity.app';

  if (event.authorization) {
    api.idToken.setCustomClaim(
      \`\${namespace}/roles\`,
      event.authorization.roles
    );
    api.accessToken.setCustomClaim(
      \`\${namespace}/roles\`,
      event.authorization.roles
    );
  }
};`}
                      </pre>
                    </div>
                  </li>
                  <li>
                    <strong className="text-white">Asignar Roles a Usuarios</strong>
                    <p className="text-slate-400 ml-5 mt-1">User Management → Users → [Usuario] → Roles → Assign Roles</p>
                  </li>
                </ol>
              </div>

              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Roles Definidos en AURITY</h3>
                <div className="space-y-2">
                  {Object.entries(ROLES).map(([key, role]) => (
                    <div key={role} className="flex items-center justify-between text-xs p-2 bg-slate-800/50 rounded">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 ${getRoleBadgeColor(role)} text-white font-medium rounded`}>
                          {getRoleName(role)}
                        </span>
                        <code className="text-slate-400 font-mono">{role}</code>
                      </div>
                      <span className="text-slate-500">
                        {role === ROLES.SUPERADMIN && 'Full access'}
                        {role === ROLES.ADMIN && 'Admin operations'}
                        {role === ROLES.DOCTOR && 'Clinical operations'}
                        {role === ROLES.NURSE && 'Clinical assistance'}
                        {role === ROLES.STAFF && 'Administrative'}
                        {role === ROLES.VIEWER && 'Read-only'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-300 mb-2">📚 Referencias</h3>
                <ul className="text-xs text-blue-400/80 space-y-1">
                  <li>→ <a href="https://auth0.com/docs/manage-users/access-control/rbac" target="_blank" rel="noopener noreferrer" className="hover:underline">Auth0 RBAC Documentation</a></li>
                  <li>→ <a href="https://auth0.com/docs/customize/actions" target="_blank" rel="noopener noreferrer" className="hover:underline">Auth0 Actions Guide</a></li>
                  <li>→ <a href="https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims" target="_blank" rel="noopener noreferrer" className="hover:underline">Custom JWT Claims</a></li>
                </ul>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
              <a
                href="https://manage.auth0.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                Abrir Auth0 Dashboard
              </a>
              <button
                onClick={() => setShowRolesModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAuditModal(false)}>
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Audit Trail</h2>
              <p className="text-sm text-slate-400 mt-1">Registro de auditoría del sistema</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-emerald-300 mb-2">✅ Backend Audit Trail Activo</h3>
                <p className="text-xs text-slate-300 mb-3">
                  El backend ya registra todas las operaciones en HDF5:
                </p>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                  <li>Operaciones LLM (generate, embed)</li>
                  <li>Exportaciones de datos</li>
                  <li>Búsquedas en corpus</li>
                  <li>Operaciones críticas (delete)</li>
                </ul>
                <div className="mt-3 bg-slate-950/50 p-2 rounded">
                  <code className="text-[10px] text-emerald-400">
                    Location: /storage/corpus.h5:/audit_logs
                  </code>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Estructura de Logs</h3>
                <div className="bg-slate-950/50 p-3 rounded">
                  <pre className="text-[10px] text-slate-400 overflow-x-auto">
{`{
  "timestamp": "2025-11-20T02:45:12Z",
  "operation": "llm_generate",
  "user_id": "auth0|123...",
  "user_email": "doctor@hospital.com",
  "payload_hash": "sha256:abc...",
  "result_hash": "sha256:def...",
  "cost_usd": 0.0042,
  "level": "info"
}`}
                  </pre>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-300 mb-2">🚧 UI de Auditoría - En Desarrollo</h3>
                <p className="text-xs text-yellow-400/80 mb-2">
                  Próximamente: Interfaz para visualizar y filtrar logs de auditoría
                </p>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  <li>Timeline de eventos con filtros</li>
                  <li>Búsqueda por usuario, operación, fecha</li>
                  <li>Export de logs (CSV, JSON)</li>
                  <li>Alertas en tiempo real</li>
                  <li>Estadísticas de uso por usuario</li>
                </ul>
              </div>

              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-300 mb-2">🔍 Inspección Manual</h3>
                <p className="text-xs text-slate-300 mb-2">
                  Puedes inspeccionar los logs manualmente usando:
                </p>
                <div className="bg-slate-950/50 p-2 rounded">
                  <code className="text-[10px] text-blue-400">
                    python backend/tools/inspect_corpus.py --audit-logs
                  </code>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
