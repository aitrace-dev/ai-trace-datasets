import { ReactNode } from 'react';
import { Auth0Provider } from './Auth0Provider';
import Auth0LoginScreen from './Auth0LoginScreen';
import { auth0Config } from './auth0Config';
import LoginScreen from '@/core/components/LoginScreen';

// Check if the deployment mode is SASS
const isSaasMode = import.meta.env.VITE_DEPLOYMENT_MODE === 'SASS';

/**
 * Authentication provider that conditionally uses Auth0 based on deployment mode
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Only use Auth0 in SASS mode
  if (isSaasMode) {
    return (
      <Auth0Provider
        domain={auth0Config.domain}
        clientId={auth0Config.clientId}
        redirectUri={auth0Config.redirectUri}
        audience={auth0Config.audience}
      >
        {children}
      </Auth0Provider>
    );
  }
  
  // Use regular authentication for non-SASS mode
  return <>{children}</>;
};

/**
 * Login screen component that conditionally renders Auth0 or regular login
 */
export const LoginComponent = ({ onLogin }: { onLogin: (token: string) => void }) => {
  // Use Auth0 login in SASS mode
  if (isSaasMode) {
    return <Auth0LoginScreen onLogin={onLogin} />;
  }
  
  // Use regular login for non-SASS mode
  return <LoginScreen onLogin={onLogin} />;
};

// Export Auth0 utilities for use in the application
export * from './auth0Utils';

// Re-export useAuth0 hook from auth0-react for use in the application
export { useAuth0 } from '@auth0/auth0-react';
