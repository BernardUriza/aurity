/**
 * Navigation Configuration
 * Card: FI-UI-FEAT-208
 *
 * Defines all routes and keyboard shortcuts for Index Hub
 */

import {
  LayoutDashboard,
  Clock,
  Shield,
  FileText,
  Server,
  Stethoscope,
  BookOpen,
  UserPlus,
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
    id: "medical-ai",
    title: "Medical AI Workflow",
    description: "Workflow médico completo con IA",
    href: "/medical-ai",
    icon: Stethoscope,
    shortcut: "1",
    badge: "AI",
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
    id: "timeline",
    title: "Timeline",
    description: "Vista cronológica de eventos",
    href: "/timeline",
    icon: Clock,
    shortcut: "3",
  },
  {
    id: "history",
    title: "History",
    description: "Historial de sesiones médicas",
    href: "/history",
    icon: BookOpen,
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
    id: "audit",
    title: "Audit",
    description: "Log de auditoría del sistema",
    href: "/audit",
    icon: FileText,
    shortcut: "6",
  },
  {
    id: "onboarding",
    title: "Onboarding",
    description: "Guía de bienvenida al sistema",
    href: "/onboarding",
    icon: UserPlus,
    shortcut: "7",
  },
  {
    id: "nas-installer",
    title: "NAS Installer",
    description: "Guía de instalación en NAS / PC",
    href: "/infra/nas-installer",
    icon: Server,
    shortcut: "8",
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
