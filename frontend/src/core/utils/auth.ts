export function getAuthToken(): string | null {
  return localStorage.getItem("ai_trace_token");
}

export function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Function to handle logout
export function logout(): void {
  localStorage.removeItem("ai_trace_token");
  // Redirect to root path which handles authentication
  window.location.href = "/";
}

// Setup fetch interceptor to handle 401 responses
export function setupFetchInterceptor(): void {
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Call the original fetch
    const response = await originalFetch(input, init);
    
    // Check for 401 Unauthorized response
    if (response.status === 401) {
      console.warn("Received 401 Unauthorized response, logging out");
      logout();
    }
    
    return response;
  };
}

import { jwtDecode } from 'jwt-decode';

// Decode JWT token using jwt-decode library
export function decodeJWT(token: string): any {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

// Check if the current user has admin role
export function isUserAdmin(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    const decodedToken = decodeJWT(token);
    // Check for admin role in the token payload
    // This assumes the token has a 'role' or 'roles' field
    // Adjust according to your actual token structure
    return (
      decodedToken?.role === 'admin' || 
      (Array.isArray(decodedToken?.roles) && decodedToken.roles.includes('admin'))
    );
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
