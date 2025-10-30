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
  Server,
  Mic,
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
    id: "triage",
    title: "Triage Intake",
    description: "Captura de conversación médica",
    href: "/triage",
    icon: Mic,
    shortcut: "1",
    badge: "Live",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "KPIs y métricas del sistema",
    href: "/dashboard",
    icon: LayoutDashboard,
    shortcut: "2",
  },
  {
    id: "sessions",
    title: "Sessions",
    description: "Explorar todas las sesiones",
    href: "/sessions",
    icon: List,
    shortcut: "3",
  },
  {
    id: "timeline",
    title: "Timeline",
    description: "Vista cronológica de eventos",
    href: "/timeline",
    icon: Clock,
    shortcut: "4",
  },
  {
    id: "export",
    title: "Export/Verify",
    description: "Exportar y verificar integridad",
    href: "/export",
    icon: Download,
    shortcut: "5",
  },
  {
    id: "policy",
    title: "Policy",
    description: "Configuración de políticas",
    href: "/policy",
    icon: Shield,
    shortcut: "6",
  },
  {
    id: "viewer",
    title: "Viewer",
    description: "Vista detallada de interacciones",
    href: "/viewer",
    icon: Eye,
    shortcut: "7",
  },
  {
    id: "audit",
    title: "Audit",
    description: "Log de auditoría del sistema",
    href: "/audit",
    icon: FileText,
    shortcut: "8",
  },
  {
    id: "demo",
    title: "Demo Loader",
    description: "Cargar dataset de demostración",
    href: "/demo",
    icon: Database,
    shortcut: "9",
  },
  {
    id: "nas-installer",
    title: "NAS Installer",
    description: "Guía de instalación en NAS / PC",
    href: "/infra/nas-installer",
    icon: Server,
    shortcut: "0",
  },
];

/**
 * Get route by shortcut key (1-9)
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
