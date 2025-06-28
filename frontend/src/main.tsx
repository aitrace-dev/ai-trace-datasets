import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupFetchInterceptor } from './core/utils/auth'

// Initialize the fetch interceptor to handle 401 responses
setupFetchInterceptor();

createRoot(document.getElementById("root")!).render(<App />);
