/**
 * Navigation Configuration
 * Card: FI-UI-FEAT-208
 *
 * Defines all routes and keyboard shortcuts for Index Hub
 */

import {
  LayoutDashboard,
  List,
  Clock,
  Download,
  Shield,
  Eye,
  FileText,
  Database,
  type LucideIcon,
} from "lucide-react";

export interface NavRoute {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  shortcut: string;
  badge?: string;
}

export const NAV_ROUTES: NavRoute[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "KPIs y métricas del sistema",
    href: "/dashboard",
    icon: LayoutDashboard,
    shortcut: "1",
  },
  {
    id: "sessions",
    title: "Sessions",
    description: "Explorar todas las sesiones",
    href: "/sessions",
    icon: List,
    shortcut: "2",
  },
  {
    id: "timeline",
    title: "Timeline",
    description: "Vista cronológica de eventos",
    href: "/timeline",
    icon: Clock,
    shortcut: "3",
  },
  {
    id: "export",
    title: "Export/Verify",
    description: "Exportar y verificar integridad",
    href: "/export",
    icon: Download,
    shortcut: "4",
  },
  {
    id: "policy",
    title: "Policy",
    description: "Configuración de políticas",
    href: "/policy",
    icon: Shield,
    shortcut: "5",
  },
  {
    id: "viewer",
    title: "Viewer",
    description: "Vista detallada de interacciones",
    href: "/viewer",
    icon: Eye,
    shortcut: "6",
  },
  {
    id: "audit",
    title: "Audit",
    description: "Log de auditoría del sistema",
    href: "/audit",
    icon: FileText,
    shortcut: "7",
  },
  {
    id: "demo",
    title: "Demo Loader",
    description: "Cargar dataset de demostración",
    href: "/demo",
    icon: Database,
    shortcut: "8",
  },
];

/**
 * Get route by shortcut key (1-8)
 */
export function getRouteByShortcut(key: string): NavRoute | undefined {
  return NAV_ROUTES.find((route) => route.shortcut === key);
}

/**
 * Get route by href
 */
export function getRouteByHref(href: string): NavRoute | undefined {
  return NAV_ROUTES.find((route) => route.href === href);
}
