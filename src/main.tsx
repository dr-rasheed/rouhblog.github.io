import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthorsProvider } from './contexts/AuthorsContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthorsProvider>
      <App />
    </AuthorsProvider>
  </StrictMode>,
);
