import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { API_BASE_URL } from '@/config';

interface Auth0LoginScreenProps {
  onLogin: (token: string) => void;
}

/**
 * Auth0 Login Screen component that handles Universal Login with Auth0
 */
const Auth0LoginScreen = ({ onLogin }: Auth0LoginScreenProps) => {
  const { 
    loginWithRedirect, 
    isAuthenticated, 
    getAccessTokenSilently, 
    isLoading: auth0Loading, 
    error: auth0Error 
  } = useAuth0();
  
  const [isLoading, setIsLoading] = useState(auth0Loading);
  const [error, setError] = useState<Error | null>(auth0Error);

  // Handle successful authentication
  useEffect(() => {
    const getAndExchangeToken = async () => {
      if (isAuthenticated) {
        setIsLoading(true);
        try {
          // Get the access token from Auth0
          const auth0Token = await getAccessTokenSilently();
          
          // Exchange the Auth0 token for an application token
          const response = await fetch(`${API_BASE_URL}/api/v1/auth/exchange-token`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${auth0Token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.statusText}`);
          }
          
          const { access_token } = await response.json();
          
          // Store the application token and notify parent component
          localStorage.setItem('ai_trace_token', access_token);
          onLogin(access_token);
        } catch (err) {
          console.error('Error in Auth0 authentication process:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setIsLoading(false);
        }
      }
    };

    getAndExchangeToken();
  }, [isAuthenticated, getAccessTokenSilently, onLogin]);

  // Redirect to Auth0 login page
  const handleLogin = () => {
    loginWithRedirect();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col gap-4 border border-blue-100">
          <h2 className="text-2xl font-bold mb-2 text-blue-700">Loading...</h2>
          <p>Please wait while we authenticate you.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col gap-4 border border-blue-100">
          <h2 className="text-2xl font-bold mb-2 text-red-700">Authentication Error</h2>
          <p className="text-red-600">{error.message}</p>
          <Button onClick={handleLogin}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col gap-4 border border-blue-100">
        <h2 className="text-2xl font-bold mb-2 text-blue-700">AI Trace Login</h2>
        <p className="mb-4">Please sign in to access AI Trace Datasets</p>
        <Button 
          onClick={handleLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded px-4 py-2"
        >
          Sign In with Auth0
        </Button>
      </div>
    </div>
  );
};

export default Auth0LoginScreen;
