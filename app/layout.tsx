// =============================================================================
// AURITY FRAMEWORK - Root Layout
// =============================================================================
// Next.js 14 root layout component
// Sprint: SPR-2025W44
// Version: 0.1.0
// Updated: FI-UI-FEAT-204 - Added GlobalPolicyBanner
// =============================================================================

import type { Metadata } from 'next';
import './globals.css';
import { GlobalPolicyBanner } from '@/components/GlobalPolicyBanner';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Aurity Framework',
  description: 'Free Intelligence - Data Sovereignty Framework for Healthcare',
  keywords: ['healthcare', 'data sovereignty', 'PHI', 'HIPAA', 'medical'],
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-slate-900 antialiased">
        <ThemeProvider>
          <GlobalPolicyBanner />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
