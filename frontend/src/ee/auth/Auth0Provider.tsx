import { Auth0Provider as Auth0ProviderBase } from '@auth0/auth0-react';
import { ReactNode, useEffect } from 'react';
import { setupAuth0FetchInterceptor } from './auth0Utils';

// Auth0 configuration interface
interface Auth0ProviderProps {
  children: ReactNode;
  domain: string;
  clientId: string;
  redirectUri: string;
  audience?: string;
}

/**
 * Auth0 Provider component that wraps the application with Auth0 authentication context
 */
export const Auth0Provider = ({ 
  children, 
  domain, 
  clientId, 
  redirectUri,
  audience 
}: Auth0ProviderProps) => {
  // Set up the fetch interceptor when the component mounts
  useEffect(() => {
    // Setup the fetch interceptor to prevent non-admin users from accessing admin endpoints
    setupAuth0FetchInterceptor(() => {
      // This is the logout callback that will be called if a 401 is received
      console.log('Logging out due to authentication error');
      // The actual logout logic is handled inside the interceptor
    });
    
    return () => {
      // Restore the original fetch when the component unmounts
      // This is a no-op right now as we don't have a way to restore the original fetch
      // But it's good practice to include a cleanup function
    };
  }, []);
  
  return (
    <Auth0ProviderBase
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
      }}
    >
      {children}
    </Auth0ProviderBase>
  );
};
