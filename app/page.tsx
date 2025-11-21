'use client';

/**
 * Home Page - Slim Index Hub
 * Card: FI-UI-FEAT-209
 *
 * Minimal navigation hub for Aurity Framework
 * (Replaced full IndexHub with slim version - 63% lighter)
 *
 * Behavior:
 * - Unauthenticated users: auto-redirect to /chat
 * - Authenticated users: show SlimIndexHub
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';
import { SlimIndexHub } from '@/components/medical/SlimIndexHub';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    // Wait for Auth0 to finish loading
    if (isLoading) return;

    // Redirect unauthenticated users to /chat
    if (!isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show nothing while loading or redirecting
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return <SlimIndexHub />;
}
