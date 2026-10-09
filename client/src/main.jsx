import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { VoiceProvider } from './context/VoiceContext';
import './index.css';

// Register PWA service worker safely
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        console.log('[AiRus PWA] Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[AiRus PWA] Service Worker registration skipped or failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <VoiceProvider>
        <App />
      </VoiceProvider>
    </AuthProvider>
  </React.StrictMode>
);
