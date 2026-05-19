/**
 * TerrellOS Mobile Install Hook
 * Handles PWA install prompt, iOS Add-to-Home-Screen detection,
 * and offline/online state.
 */

import { useState, useEffect } from 'react';

export function useMobileInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Detect mobile
    setIsMobile(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent) || window.innerWidth < 768);

    // Detect if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsInstalled(standalone);

    // Android/Chrome install prompt
    function handleInstallPrompt(e) {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    }

    // Online/offline
    function handleOnline()  { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function promptInstall() {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
    setIsInstallable(false);
    return outcome === 'accepted';
  }

  return { isInstallable, isInstalled, isIOS, isOnline, isMobile, promptInstall };
}