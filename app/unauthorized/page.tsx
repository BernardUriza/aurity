'use client';

/**
 * Unauthorized Page
 * HIPAA Card: G-003 - Auth0 Integration
 *
 * Shown when user doesn't have required role permissions.
 */

import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth0();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-red-900/20 border border-red-500/50 rounded-lg p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-white text-center mb-3">
          Acceso No Autorizado
        </h1>
        <p className="text-red-200 text-center mb-6">
          Tu rol actual <strong>({user?.email})</strong> no tiene permisos para acceder a esta página.
        </p>

        {/* Help Text */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-white mb-2">¿Necesitas acceso?</h2>
          <p className="text-sm text-slate-300">
            Contacta al administrador del sistema para solicitar permisos adicionales.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Volver al Inicio
          </button>

          <button
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cambiar de Cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
