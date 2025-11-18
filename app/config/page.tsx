'use client';

/**
 * System Configuration Page
 * SUPERADMIN ONLY - bernarduriza@gmail.com
 *
 * Global system settings and advanced configuration
 */

import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { configHeader } from '@/config/page-headers';

export default function ConfigPage() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  // Check superadmin access
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.email !== 'bernarduriza@gmail.com') {
      console.warn('[ConfigPage] Access denied - not superadmin');
      router.push('/unauthorized');
    }
  }, [isLoading, isAuthenticated, user, router]);

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

  if (!isAuthenticated || user?.email !== 'bernarduriza@gmail.com') {
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
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                  Ver Usuarios
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-700">
                <div>
                  <p className="text-white font-medium">Roles & Permisos</p>
                  <p className="text-sm text-slate-400">Configurar RBAC (Auth0)</p>
                </div>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                  Configurar
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Audit Trail</p>
                  <p className="text-sm text-slate-400">Registro completo de cambios</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                  Ver Auditoría
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
