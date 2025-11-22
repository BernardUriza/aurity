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
  Brain,
  Building2,
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
    description: "Conversación continua con navegación",
    href: "/timeline",
    icon: Clock,
    shortcut: "3",
  },
  {
    id: "policy",
    title: "Policy",
    description: "Configuración de políticas",
    href: "/policy",
    icon: Shield,
    shortcut: "4",
  },
  {
    id: "audit",
    title: "Audit",
    description: "Log de auditoría del sistema",
    href: "/audit",
    icon: FileText,
    shortcut: "5",
  },
  {
    id: "onboarding",
    title: "Onboarding",
    description: "Guía de bienvenida al sistema",
    href: "/onboarding",
    icon: UserPlus,
    shortcut: "6",
  },
  {
    id: "nas-installer",
    title: "NAS Installer",
    description: "Guía de instalación en NAS / PC",
    href: "/infra/nas-installer",
    icon: Server,
    shortcut: "7",
  },
  {
    id: "personas-admin",
    title: "AI Personas",
    description: "Gestión de personas médicas del sistema",
    href: "/admin/personas",
    icon: Brain,
    shortcut: "8",
    badge: "Admin",
  },
  {
    id: "clinics-admin",
    title: "Clínicas",
    description: "Gestión de clínicas, doctores y check-in",
    href: "/admin/clinics",
    icon: Building2,
    shortcut: "9",
    badge: "Admin",
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
