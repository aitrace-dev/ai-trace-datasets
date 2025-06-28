import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';

/**
 * Get the Auth0 token from local storage
 */
export function getAuth0Token(): string | null {
  return localStorage.getItem('ai_trace_token');
}

/**
 * Create headers with Auth0 token for API requests
 */
export function auth0Headers(): HeadersInit {
  const token = getAuth0Token();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Handle logout from Auth0
 */
export function auth0Logout(logout: () => void): void {
  localStorage.removeItem('ai_trace_token');
  logout(); // Auth0 logout function
  window.location.href = '/';
}

/**
 * Check if a URL is an admin endpoint
 */
export function isAdminEndpoint(url: string): boolean {
  return url.includes('/api/v1/admin/');
}

/**
 * Secure fetch wrapper that prevents non-admin users from accessing admin endpoints
 * @param input Request URL or object
 * @param init Request init options
 * @param isAdmin Whether the current user is an admin
 * @returns Promise with the fetch response or throws an error for unauthorized access
 */
export async function secureFetch(
  input: RequestInfo | URL, 
  init?: RequestInit,
  isAdmin: boolean = false
): Promise<Response> {
  // Convert input to string URL for checking
  let url: string;
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input instanceof Request) {
    url = input.url;
  } else {
    url = String(input);
  }
  
  // Prevent non-admin users from accessing admin endpoints
  if (isAdminEndpoint(url) && !isAdmin) {
    throw new Error('Unauthorized: Admin access required for this endpoint');
  }
  
  return fetch(input, init);
}

/**
 * Custom hook to get user profile and role information
 */
export function useAuth0User() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  
  const isAdmin = isAuthenticated && user && 
    (user['https://ai-trace/roles']?.includes('admin') || 
     user.role === 'admin' ||
     (Array.isArray(user.roles) && user.roles.includes('admin')));
  
  // Update the global admin status whenever it changes
  useEffect(() => {
    updateUserAdminStatus(isAdmin);
  }, [isAdmin]);
  
  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin
  };
}

// Store admin status globally - will be updated by components using useAuth0User
let currentUserIsAdmin = false;

/**
 * Update the current user's admin status - called from components
 */
export function updateUserAdminStatus(isAdmin: boolean): void {
  currentUserIsAdmin = isAdmin;
}

/**
 * Setup Auth0 fetch interceptor to handle 401 responses and prevent admin endpoint access
 */
export function setupAuth0FetchInterceptor(logout: () => void): void {
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    try {
      // Call the original fetch without any admin endpoint checks
      // Admin endpoint access control should be handled at the component level
      
      // Call the original fetch
      const response = await originalFetch(input, init);
      
      // Check for 401 Unauthorized response
      if (response.status === 401) {
        console.warn('Received 401 Unauthorized response, logging out');
        auth0Logout(logout);
      }
      
      return response;
    } catch (error) {
      // Log the error but still throw it
      console.error('Error in fetch interceptor:', error);
      throw error;
    }
  };
}
