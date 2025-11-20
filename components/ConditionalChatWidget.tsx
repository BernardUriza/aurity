'use client';

/**
 * ConditionalChatWidget - Client Component Wrapper
 *
 * Wraps ChatWidget with route-aware conditional rendering.
 * This pattern keeps the root layout as a server component (preserving metadata)
 * while enabling client-side pathname detection.
 *
 * Best Practice Pattern:
 * - Root layout = Server Component (with metadata)
 * - This wrapper = Client Component (with usePathname)
 * - ChatWidget = Nested client component (interactive features)
 */

import { usePathname } from 'next/navigation';
import { ChatWidget } from './ChatWidget';

/**
 * Routes where the floating ChatWidget should not appear
 */
const EXCLUDED_ROUTES = [
  '/chat-public',  // Dedicated public chat page (has its own fullscreen chat)
  '/_not-found',   // 404 page
];

export function ConditionalChatWidget() {
  const pathname = usePathname();

  // Normalize pathname (remove trailing slash for consistent comparison)
  const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  // Don't render ChatWidget on excluded routes
  if (EXCLUDED_ROUTES.includes(normalizedPath)) {
    return null;
  }

  return <ChatWidget />;
}
