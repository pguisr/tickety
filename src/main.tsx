import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Mock API removida - usando Supabase em produção

createRoot(document.getElementById("root")!).render(<App />);
