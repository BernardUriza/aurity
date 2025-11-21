// =============================================================================
// AURITY FRAMEWORK - Root Layout
// =============================================================================
// Next.js 14 root layout component
// Sprint: SPR-2025W44
// Version: 0.1.0
// Updated: HIPAA G-003 - Auth0 Integration + Always-Visible User Display
// =============================================================================

import type { Metadata } from 'next';
import './globals.css';
import { GlobalPolicyBanner } from '@/components/policy/GlobalPolicyBanner';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { Auth0Provider } from '@/components/auth/Auth0Provider';
import { ConditionalChatWidget } from '@/components/chat/ConditionalChatWidget';

export const metadata: Metadata = {
  title: 'Free Intelligence · AURITY',
  description: 'Asistente médico con IA en la nube. Tus datos seguros, notas SOAP automáticas, asesoría clínica basada en evidencia. Opción self-hosted disponible.',
  keywords: ['healthcare', 'cloud AI', 'data security', 'PHI', 'HIPAA', 'medical AI', 'SOAP notes', 'clinical advisor', 'telemedicine', 'self-hosted'],

  // PWA Configuration
  manifest: '/manifest.json',
  applicationName: 'AURITY',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AURITY',
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },

  // Open Graph (WhatsApp, Facebook, LinkedIn)
  openGraph: {
    title: 'Free Intelligence · AURITY',
    description: 'Asistente médico con IA en la nube. Tus datos siempre seguros, con opción de instalación propia.',
    url: 'https://app.aurity.io/chat',
    siteName: 'Free Intelligence',
    images: [
      {
        url: 'https://app.aurity.io/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'Free Intelligence - IA Médica Segura en la Nube',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Free Intelligence · AURITY',
    description: 'Asistente médico con IA en la nube. Tus datos siempre seguros, con opción de instalación propia.',
    images: ['https://app.aurity.io/og-banner.png'],
    creator: '@freeintelligence', // TODO: Update with real Twitter handle
  },

  // Additional metadata
  authors: [{ name: 'Dr. Bernard Uriza Orozco' }],
  creator: 'Free Intelligence Team',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/icons/icon-192x192.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />

        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AURITY" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.svg" />

        {/* Splash Screens for iOS (optional - can be generated later) */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.svg" />

        {/* Eruda - Mobile DevTools Console (TEMPORARY - Remove after debugging) */}
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script dangerouslySetInnerHTML={{ __html: `eruda.init();` }} />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[PWA] Service Worker registered with scope:', registration.scope);
                    })
                    .catch(function(error) {
                      console.error('[PWA] Service Worker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-900 antialiased">
        <Auth0Provider>
          <ThemeProvider>
            <GlobalPolicyBanner />
            {children}
            <ConditionalChatWidget />
          </ThemeProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
