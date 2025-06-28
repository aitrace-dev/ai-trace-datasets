import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { isUserAdmin, logout as standardLogout } from '@/core/utils/auth';

// Import Auth0 hooks directly
import { useAuth0 } from '@auth0/auth0-react';

// Check if the deployment mode is SASS
const isSaasMode = import.meta.env.VITE_DEPLOYMENT_MODE === 'SASS';

// Token key for localStorage
const TOKEN_KEY = "ai_trace_token";

const Header = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user has admin role
    setIsAdmin(isUserAdmin());
  }, []);

  // Get Auth0 logout function if in SASS mode
  const auth0Context = isSaasMode ? useAuth0() : null;

  const handleLogout = () => {
    if (isSaasMode && auth0Context) {
      // Use Auth0 logout in SASS mode
      localStorage.removeItem(TOKEN_KEY);
      auth0Context.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
    } else {
      // Use standard logout in non-SASS mode
      standardLogout();
    }
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/lovable-uploads/176fa959-ee85-4b29-af09-7e7f7b8bc894.png" alt="AI Trace Logo" className="h-8" />
        </div>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Datasets
          </Link>
          <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
            style={{ marginLeft: 8 }}
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
