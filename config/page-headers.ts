/**
 * Page Header Configurations
 *
 * Centralized config for all page headers in the AURITY app.
 * Each page can override or extend these defaults.
 */

import type { PageHeaderConfig } from '../components/PageHeader'

export type PageHeaderFactory = (data?: any) => PageHeaderConfig

/**
 * Dashboard header config (TV Display for clinic)
 * @param data - { sessionsToday, totalInteractions, p95Ingestion, asOf }
 */
export const dashboardHeader: PageHeaderFactory = (data) => ({
  showBackButton: true,
  backPath: '/',
  title: 'System Dashboard · TV Mode',
  subtitle: data?.asOf
    ? `Live monitoring · Auto-refresh every 30s · Last update: ${new Date(data.asOf).toLocaleTimeString()}`
    : 'Live monitoring · Clinic display',
  metrics: [], // Metrics in TV UI body, not header
})

/**
 * Timeline header config
 * @param data - { totalEvents, p95Latency, sessionId, successRate, totalDuration }
 */
export const timelineHeader: PageHeaderFactory = (data) => ({
  showBackButton: true,
  backPath: '/',
  title: 'Timeline Continuo',
  subtitle: data?.sessionId
    ? `Conversación infinita · Filtro: ${data.sessionId.slice(0, 8)}...`
    : 'Conversación infinita',
  metrics: data?.totalEvents > 0 ? [
    {
      icon: 'activity',
      label: '',
      value: data.totalEvents,
    },
    {
      icon: 'checkCircle2',
      label: '',
      value: `${data.successRate.toFixed(0)}%`,
    },
    {
      icon: 'zap',
      label: '',
      value: `p95: ${data.p95Latency.toFixed(0)}ms`,
    },
    {
      icon: 'clock',
      label: '',
      value: `${data.totalDuration.toFixed(1)}s`,
    },
  ] : [],
})

/**
 * Audit Log header config
 * @param data - { logsCount, selectedOperation }
 */
export const auditHeader: PageHeaderFactory = (data) => ({
  showBackButton: true,
  backPath: '/',
  icon: 'shield',
  iconColor: 'text-blue-400',
  title: 'Audit Log',
  subtitle: 'System security trail · Append-only',
  metrics: [
    {
      icon: 'activity',
      label: '',
      value: `${data?.logsCount || 0} events`,
    },
    ...(data?.selectedOperation && data.selectedOperation !== 'ALL' ? [{
      icon: 'filter',
      label: '',
      value: data.selectedOperation,
      variant: 'primary' as const,
    }] : []),
  ],
})

/**
 * Medical AI header config
 * @param data - { subtitle, patientName }
 */
export const medicalAiHeader: PageHeaderFactory = (data) => ({
  showBackButton: true,
  backPath: '/',
  icon: 'stethoscope',
  iconColor: 'text-emerald-400',
  title: 'Medical AI Workflow',
  subtitle: data?.subtitle || 'Selecciona paciente o continúa consulta',
  metrics: [],
})

/**
 * Policy Viewer header config
 * @param data - { version, source, timestamp }
 */
export const policyHeader: PageHeaderFactory = (data) => ({
  showBackButton: true,
  backPath: '/',
  icon: 'fileText',
  iconColor: 'text-purple-400',
  title: 'Policy Configuration',
  subtitle: data?.version
    ? `Effective policy · Version ${data.version} · Read-only snapshot`
    : 'Effective policy configuration · Read-only',
  metrics: data?.version ? [
    {
      icon: 'tag',
      label: '',
      value: `v${data.version}`,
    },
    ...(data.timestamp && data.timestamp !== 'unknown' ? [{
      icon: 'clock',
      label: '',
      value: data.timestamp,
    }] : []),
  ] : [],
})

/**
 * User Profile header config
 * @param data - { userName, email, role, emailVerified }
 */
export const profileHeader: PageHeaderFactory = (data) => ({
  showBackButton: true,
  backPath: '/',
  icon: 'user',
  iconColor: 'text-blue-400',
  title: 'Mi Perfil',
  subtitle: data?.email
    ? `${data.email}${data.emailVerified ? ' · Verificado' : ''}`
    : 'Información de usuario',
  metrics: data?.role ? [
    {
      icon: 'shield',
      label: 'Rol',
      value: data.role,
    },
  ] : [],
})

/**
 * Settings/Config header config
 * @param data - { section }
 * Note: Config and Profile share the same /profile endpoint
 */
export const configHeader: PageHeaderFactory = (data) => ({
  showBackButton: true,
  backPath: '/',
  icon: 'settings',
  iconColor: 'text-slate-400',
  title: 'Configuración',
  subtitle: data?.section
    ? `${data.section} · Configuración de usuario`
    : 'Configuración de usuario',
  metrics: [],
})

/**
 * Centralized header configs by route
 */
export const PAGE_HEADERS = {
  dashboard: dashboardHeader,
  timeline: timelineHeader,
  audit: auditHeader,
  'medical-ai': medicalAiHeader,
  policy: policyHeader,
  profile: profileHeader,
  config: configHeader,
} as const

export type PageRoute = keyof typeof PAGE_HEADERS
