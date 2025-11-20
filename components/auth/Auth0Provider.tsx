'use client';

/**
 * Auth0Provider Component
 * HIPAA Card: G-003 - Auth0 OAuth2/OIDC Integration
 *
 * Client-side Auth0 authentication provider for Next.js 14 App Router.
 * Wraps the entire app to provide authentication context.
 */

import { Auth0Provider as Auth0ProviderSDK } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface Auth0ProviderProps {
  children: ReactNode;
}

export function Auth0Provider({ children }: Auth0ProviderProps) {
  const router = useRouter();

  // Auth0 configuration (matches backend config)
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'dev-1r4daup7ofj7q6gn.us.auth0.com';
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || 'rYOowVCxSqeSNFVOFsZuVIiYsjw4wkKp';
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || 'https://api.fi-aurity.duckdns.org';

  // Determine redirect URI based on environment
  const redirectUri = typeof window !== 'undefined'
    ? window.location.origin + '/callback'
    : process.env.NEXT_PUBLIC_BASE_URL + '/callback';

  const onRedirectCallback = (appState?: any) => {
    console.log('[Auth0Provider] onRedirectCallback called with appState:', appState);

    // Navigate to the returnTo URL or dashboard
    const targetUrl = appState?.returnTo || '/dashboard';
    console.log('[Auth0Provider] Redirecting to:', targetUrl);

    // Use window.location for more reliable redirect
    window.location.href = targetUrl;
  };

  return (
    <Auth0ProviderSDK
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: 'openid profile email offline_access',
      }}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0ProviderSDK>
  );
}
