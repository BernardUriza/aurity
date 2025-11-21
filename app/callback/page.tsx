'use client';

/**
 * Auth0 Callback Page
 * HIPAA Card: G-003 - Auth0 OAuth2/OIDC Integration
 *
 * Handles Auth0 redirect after successful login.
 * Shows loading state while Auth0 processes the authentication.
 */

import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const { isLoading, isAuthenticated, error } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    console.log('[Callback] Auth state:', { isLoading, isAuthenticated, error });

    // Redirect to dashboard after successful authentication
    if (!isLoading && isAuthenticated) {
      console.log('[Callback] Redirecting to /dashboard');
      // Use replace instead of push to avoid back button issues
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router, error]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="max-w-md w-full bg-red-900/20 border border-red-500 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-xl font-bold text-white">Error de Autenticación</h1>
          </div>
          <p className="text-red-200 mb-4">{error.message}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        {/* Animated spinner */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        </div>

        {/* Loading text */}
        <h1 className="text-2xl font-bold text-white mb-2">Autenticando...</h1>
        <p className="text-slate-400">Por favor espera mientras procesamos tu inicio de sesión</p>

        {/* Security indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-green-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Conexión segura con Auth0</span>
        </div>
      </div>
    </div>
  );
}
