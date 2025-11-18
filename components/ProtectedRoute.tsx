'use client';

/**
 * ProtectedRoute Component
 * HIPAA Card: G-003 - Auth0 Integration
 *
 * Protects routes by requiring authentication.
 * Redirects unauthenticated users to login page.
 */

import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRoles?: string[];
}

export function ProtectedRoute({ children, requireRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, loginWithRedirect, user, getAccessTokenSilently } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for Auth0 to finish loading
      if (isLoading) return;

      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        loginWithRedirect({
          appState: {
            returnTo: window.location.pathname,
          },
        });
        return;
      }

      console.log('[ProtectedRoute] User authenticated:', user?.email);

      // SUPERADMIN BYPASS - bernarduriza@gmail.com has full access
      if (user?.email === 'bernarduriza@gmail.com') {
        console.log('[ProtectedRoute] ⭐ SUPERADMIN BYPASS - Full access granted');
        return;
      }

      // Check role requirements if specified
      if (requireRoles && requireRoles.length > 0) {
        try {
          const token = await getAccessTokenSilently();
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userRoles = payload['https://aurity.app/roles'] || [];

          console.log('[ProtectedRoute] Required roles:', requireRoles);
          console.log('[ProtectedRoute] User roles:', userRoles);

          // Check if user has at least one required role
          const hasRequiredRole = requireRoles.some(role => userRoles.includes(role));

          if (!hasRequiredRole) {
            console.warn('[ProtectedRoute] Access denied - missing required roles');
            // User doesn't have required role - redirect to unauthorized page
            router.push('/unauthorized');
            return;
          }

          console.log('[ProtectedRoute] ✅ Access granted');
        } catch (error) {
          console.error('[ProtectedRoute] Failed to check user roles:', error);
          // On error, allow access for now (lenient mode during setup)
          console.warn('[ProtectedRoute] ⚠️ Role check failed, allowing access (setup mode)');
          return;
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoading, loginWithRedirect, requireRoles, getAccessTokenSilently, router, user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          {/* Animated spinner */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>

          {/* Loading text */}
          <h1 className="text-2xl font-bold text-white mb-2">Verificando autenticación...</h1>
          <p className="text-slate-400">Por favor espera</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
