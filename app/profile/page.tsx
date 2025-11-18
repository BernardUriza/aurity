'use client';

/**
 * User Profile Page
 * Shows user information and settings
 */

import { useAuth0 } from '@auth0/auth0-react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { profileHeader } from '@/config/page-headers';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Debes iniciar sesión para ver tu perfil</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Generate header config with user data
  const headerConfig = profileHeader({
    email: user?.email,
    emailVerified: user?.email_verified,
    role: user?.['https://aurity.app/roles']?.[0] || 'USER',
  });

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Page Header */}
      <PageHeader {...headerConfig} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          {/* Header with Avatar */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-6 py-8">
            <div className="flex items-center gap-4">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'User'}
                  className="w-20 h-20 rounded-full ring-4 ring-slate-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-slate-700">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{user?.name || 'Usuario'}</h2>
                <p className="text-slate-400">{user?.email}</p>
                {user?.email_verified && (
                  <div className="flex items-center gap-1 mt-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-green-400">Email verificado</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="p-6 space-y-6">
            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Información de la Cuenta</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-slate-700">
                  <span className="text-slate-400">Nombre</span>
                  <span className="text-white font-medium">{user?.name || 'No disponible'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-700">
                  <span className="text-slate-400">Email</span>
                  <span className="text-white font-medium">{user?.email || 'No disponible'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-700">
                  <span className="text-slate-400">Nickname</span>
                  <span className="text-white font-medium">{user?.nickname || 'No disponible'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-700">
                  <span className="text-slate-400">Última actualización</span>
                  <span className="text-white font-medium">
                    {user?.updated_at ? new Date(user.updated_at).toLocaleDateString('es-MX') : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>

            {/* User Metadata */}
            {user && Object.keys(user).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Datos Adicionales</h3>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <pre className="text-xs text-slate-400 overflow-auto max-h-64">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Section */}
        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Configuración</h3>
          <p className="text-slate-400 text-sm mb-4">
            La configuración de perfil se gestiona a través de Auth0. Para cambiar tu información, contacta al administrador.
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
              Cambiar contraseña
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
              Administrar sesiones
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
