'use client';

/**
 * UserDisplay Component
 * HIPAA Card: G-003 - Auth0 Integration
 *
 * Always-visible user authentication display.
 * Shows:
 * - User avatar + name + role (when logged in)
 * - Login button (when logged out)
 * - Logout dropdown
 */

import { useAuth0 } from '@auth0/auth0-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export function UserDisplay() {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // Mount portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // Distance from right edge
      });
    }
  }, [dropdownOpen]);

  // Extract role from Auth0 token
  useEffect(() => {
    const fetchUserRole = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          // Decode JWT to get roles (client-side for display only)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const roles = payload['https://aurity.app/roles'] || [];
          setUserRole(roles[0] || 'USER');
        } catch (error) {
          console.error('Failed to get user role:', error);
          setUserRole('USER');
        }
      }
    };

    fetchUserRole();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
        <div className="flex flex-col gap-1">
          <div className="w-24 h-3 bg-slate-700 rounded animate-pulse" />
          <div className="w-16 h-2 bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Not authenticated - show login button
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => loginWithRedirect()}
        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Iniciar Sesión
        </span>
      </button>
    );
  }

  // Authenticated - show compact user display
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MEDICO':
        return 'bg-green-500/20 text-green-400';
      case 'ENFERMERA':
        return 'bg-blue-500/20 text-blue-400';
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Render dropdown in portal
  const dropdownContent = dropdownOpen && mounted ? createPortal(
    <>
      {/* Backdrop to close dropdown */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setDropdownOpen(false)}
      />

      {/* Dropdown Content - Portal ensures it's not clipped */}
      <div
        className="fixed w-64 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-[10000] overflow-hidden"
        style={{
          top: `${dropdownPosition.top}px`,
          right: `${dropdownPosition.right}px`,
        }}
      >
        {/* User Info Header */}
        <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-700">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Usuario Actual</p>
          <p className="text-sm font-medium text-white truncate">{user?.email}</p>
          {user?.email_verified && (
            <div className="flex items-center gap-1 mt-1">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-green-400">Email verificado</span>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="py-2">
          <button
            onClick={() => {
              setDropdownOpen(false);
              router.push('/profile');
            }}
            className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mi Perfil
          </button>

          <button
            onClick={() => {
              setDropdownOpen(false);
              router.push('/profile');
            }}
            className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuración
          </button>
        </div>

        {/* Logout Button */}
        <div className="border-t border-slate-700 py-2">
          <button
            onClick={() => {
              setDropdownOpen(false);
              logout({ logoutParams: { returnTo: window.location.origin } });
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      {/* Compact User Display Button */}
      <button
        ref={buttonRef}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-all"
      >
        {/* Compact Avatar */}
        <div className="relative">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name || 'User'}
              className="w-7 h-7 rounded-full ring-1 ring-slate-600/50"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-xs ring-1 ring-slate-600/50">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          {/* Minimal online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-slate-800" />
        </div>

        {/* Compact User Info */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white/90 truncate max-w-[100px]">
            {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${getRoleBadgeColor(userRole)}`}>
            {userRole === 'MEDICO' ? 'MD' : userRole === 'ENFERMERA' ? 'RN' : userRole === 'ADMIN' ? 'ADM' : 'USR'}
          </span>
        </div>

        {/* Minimal Dropdown Arrow */}
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown rendered in portal */}
      {dropdownContent}
    </>
  );
}
