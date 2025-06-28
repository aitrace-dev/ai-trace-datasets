// Auth0 configuration with environment variables

// Debug environment variables
console.log('Auth0 Config - Environment Variables:');
console.log('VITE_DEPLOYMENT_MODE:', import.meta.env.VITE_DEPLOYMENT_MODE);
console.log('VITE_AUTH0_DOMAIN:', import.meta.env.VITE_AUTH0_DOMAIN);
console.log('VITE_AUTH0_CLIENT_ID:', import.meta.env.VITE_AUTH0_CLIENT_ID);
console.log('VITE_AUTH0_AUDIENCE:', import.meta.env.VITE_AUTH0_AUDIENCE);

export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || '',
  redirectUri: window.location.origin
};

// Debug auth0Config
console.log('Auth0 Config:', auth0Config);
