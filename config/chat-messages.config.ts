/**
 * Chat Messages Configuration
 *
 * Centralized content and settings for ChatWidgetMessages components
 * Following 4pt grid system and accessibility best practices
 */

/**
 * Empty State Configuration
 */
export const emptyStateConfig = {
  emoji: '💬',
  welcomeTitle: (userName?: string) => `Hola ${userName || 'Doctor'} 👋`,
  welcomeSubtitle: 'Soy tu asistente de Free Intelligence. Puedo ayudarte con:',
  features: [
    {
      icon: '✓',
      text: 'Consultas sobre pacientes y expedientes',
    },
    {
      icon: '✓',
      text: 'Generación de notas clínicas (SOAP)',
    },
    {
      icon: '✓',
      text: 'Análisis de datos médicos',
    },
  ],
  ctaText: 'Escribe tu pregunta abajo para comenzar...',
};

/**
 * Loading State Configuration
 */
export const loadingStateConfig = {
  skeletonBars: [
    { width: '75%' }, // w-3/4
    { width: '50%' }, // w-1/2
    { width: '83%' }, // w-5/6
  ],
  loadingText: 'Cargando conversación...',
  loadOlderText: 'Cargando mensajes anteriores...',
};

/**
 * Legal Disclaimer Configuration
 */
export const legalDisclaimerConfig = {
  emoji: '⚕️',
  title: 'Aviso Legal y Protección de Datos',
  mainContent: `Esta aplicación cumple con estándares de protección de información de salud (HIPAA). Tus datos están encriptados y protegidos en nuestros servidores seguros. Como asistente de IA, no tengo acceso directo a PHI sin tu autorización explícita.`,
  footerNote: 'Opción self-hosted disponible para instituciones que requieran control total de infraestructura.',

  // Timer configuration (ephemeral behavior)
  timer: {
    fadeStartMs: 14000, // Start fade-out at 14 seconds
    hideCompleteMs: 15000, // Hide completely at 15 seconds
    fadeDurationMs: 1000, // 1 second fade-out animation
  },
};

/**
 * Accessibility Labels
 */
export const a11yLabels = {
  messagesContainer: 'Historial de mensajes del chat',
  loadingConversation: 'Cargando conversación',
  loadingOlderMessages: 'Cargando mensajes anteriores',
  emptyState: 'Sin mensajes',
  typingIndicator: 'El asistente está escribiendo',
  legalInfo: 'Información legal',
  newMessageAnnouncement: {
    user: 'Mensaje enviado',
    assistant: 'Nuevo mensaje del asistente',
  },
};

/**
 * Spacing Constants (4pt grid system)
 */
export const spacing = {
  container: {
    horizontal: 'px-4', // 16px
    top: 'pt-5', // 20px
    bottom: 'pb-5', // 20px
  },
  messages: {
    grouped: 'mt-1', // 4px (tight grouping)
    ungrouped: 'mt-4', // 16px (breathing room)
    dayDivider: 'mb-6', // 24px (clear separation)
  },
  sections: {
    typingIndicator: 'mt-4', // 16px
    legalDisclaimer: 'mt-12', // 48px (significant separation)
  },
};
