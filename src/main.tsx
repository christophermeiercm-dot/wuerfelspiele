import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline-Betrieb: der Worker legt beim ersten Besuch die ganze App ab.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Übernimmt ein neuer Worker (neue Version), lädt die Seite einmal neu, damit sofort die neue Version läuft.
  const hatteWorker = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hatteWorker) window.location.reload(); });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* ohne Worker läuft die App nur online */ });
  });
}
