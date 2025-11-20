/**
 * PageHeader - Unified sticky header component
 *
 * Reusable header pattern with back button, title, metrics badges, and user display.
 * Configured via apps/aurity/config/page-headers.ts
 */

"use client"

import { useRouter } from 'next/navigation'
import { UserDisplay } from '@/components/auth/UserDisplay'
import {
  ArrowLeft,
  Home,
  Shield,
  Activity,
  Database,
  Zap,
  Filter,
  Clock,
  CheckCircle2,
  Stethoscope,
  User,
  Settings,
  FileText,
  Tag,
  type LucideIcon
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  shield: Shield,
  activity: Activity,
  database: Database,
  zap: Zap,
  filter: Filter,
  clock: Clock,
  checkCircle2: CheckCircle2,
  stethoscope: Stethoscope,
  user: User,
  settings: Settings,
  fileText: FileText,
  tag: Tag,
}

export interface PageHeaderMetric {
  icon: string
  label: string
  value: string | number
  variant?: 'default' | 'primary'
}

export interface PageHeaderConfig {
  /** Show back button (ArrowLeft + "AURITY") */
  showBackButton?: boolean
  /** Back navigation path (default: '/') */
  backPath?: string
  /** Main icon (left side, replaces back button if showBackButton=false) */
  icon?: string
  iconColor?: string
  /** Page title */
  title: string
  /** Subtitle (small text below title) */
  subtitle?: string
  /** Metrics badges (center section) */
  metrics?: PageHeaderMetric[]
  /** Additional actions (right side, before user) */
  actions?: React.ReactNode
}

export function PageHeader({
  showBackButton = false,
  backPath = '/',
  icon,
  iconColor = 'text-emerald-400',
  title,
  subtitle,
  metrics = [],
  actions,
}: PageHeaderConfig) {
  const router = useRouter()

  const IconComponent = icon ? ICON_MAP[icon] : null

  return (
    <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4 relative">
          {/* Left: Back button OR Icon + Title */}
          <div className="flex items-center gap-4">
            {showBackButton ? (
              <>
                <button
                  onClick={() => router.push(backPath)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-medium">AURITY</span>
                </button>
                <div className="h-6 w-px bg-slate-700" />
              </>
            ) : null}

            <div className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent className={`h-5 w-5 ${iconColor}`} />
              )}
              <div>
                <h1 className="text-lg font-bold text-slate-100">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-slate-500">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Center: Metrics Badges */}
          {metrics.length > 0 && (
            <div className="flex items-center gap-3">
              {metrics.map((metric, idx) => {
                const MetricIcon = ICON_MAP[metric.icon]
                const isPrimary = metric.variant === 'primary'

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                      isPrimary
                        ? 'bg-blue-500/10 border border-blue-500/30'
                        : 'bg-slate-800/50 border border-slate-700'
                    }`}
                  >
                    {MetricIcon && (
                      <MetricIcon className={`w-3.5 h-3.5 ${
                        isPrimary ? 'text-blue-400' : 'text-blue-400'
                      }`} />
                    )}
                    <span className={`text-xs font-medium ${
                      isPrimary ? 'text-blue-300' : 'text-slate-300'
                    }`}>
                      {metric.label && `${metric.label}: `}{metric.value}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Right: Actions + User */}
          <div className="flex items-center gap-2">
            {actions}
            <UserDisplay />
          </div>
        </div>
      </div>
    </div>
  )
}
