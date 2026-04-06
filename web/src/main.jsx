import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

// Capturamos el evento de instalación globalmente lo antes posible
window.pwaInstallEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.pwaInstallEvent = e;
  window.dispatchEvent(new Event('pwa-install-ready'));
});
window.addEventListener('appinstalled', () => {
  window.pwaInstallEvent = null;
  window.dispatchEvent(new Event('pwa-installed'));
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
