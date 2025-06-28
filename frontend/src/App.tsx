import { Toaster } from "@/core/components/ui/toaster";
import { Toaster as Sonner } from "@/core/components/ui/sonner";
import { TooltipProvider } from "@/core/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/core/components/Header";
import Index from "@/core/pages/Index";
import DatasetView from "@/core/pages/DatasetView";
import NotFound from "@/core/pages/NotFound";
import NewDataset from "@/core/pages/NewDataset";
import AdminPanel from "@/core/components/AdminPanel";
import { useState, useEffect } from "react";
// Import Auth0 components and regular login
import { Auth0Provider } from "@/ee/auth/Auth0Provider";
import { auth0Config } from "@/ee/auth/auth0Config";
import { LoginComponent } from "@/ee/auth";
import LoginScreen from "@/core/components/LoginScreen";

const queryClient = new QueryClient();

const TOKEN_KEY = "ai_trace_token";

// Check if the deployment mode is SASS
const isSaasMode = import.meta.env.VITE_DEPLOYMENT_MODE === 'SASS';

// Debug environment variables
console.log('VITE_DEPLOYMENT_MODE:', import.meta.env.VITE_DEPLOYMENT_MODE);
console.log('Is SASS mode:', isSaasMode);

const App = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  // Render the appropriate login component based on deployment mode
  const renderLogin = () => {
    if (isSaasMode) {
      return <LoginComponent onLogin={setToken} />;
    } else {
      return <LoginScreen onLogin={setToken} />;
    }
  };

  // Main application content
  const appContent = (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!token ? (
          renderLogin()
        ) : (
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-white">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dataset/:id" element={<DatasetView />} />
                  <Route path="/dataset/:id/labeled" element={<DatasetView />} />
                  <Route path="/dataset/:id/queued" element={<DatasetView />} />
                  <Route path="/dataset/:id/tests" element={<DatasetView />} />
                  <Route path="/new-dataset" element={<NewDataset />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );

  // Conditionally wrap with Auth0Provider only when in SASS mode
  return isSaasMode ? (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      redirectUri={auth0Config.redirectUri}
      audience={auth0Config.audience}
    >
      {appContent}
    </Auth0Provider>
  ) : (
    appContent
  );
};

export default App;
