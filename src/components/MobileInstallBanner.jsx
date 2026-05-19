/**
 * Mobile Install Banner
 * Shows for iOS (Add-to-Home-Screen guide) and Android (native install prompt).
 * Dismissed permanently via localStorage flag.
 */
import { useState } from 'react';
import { useMobileInstall } from '@/hooks/useMobileInstall';
import { Download, X, Smartphone } from 'lucide-react';

export default function MobileInstallBanner() {
  const { isInstallable, isInstalled, isIOS, isMobile, isOnline, promptInstall } = useMobileInstall();
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem('terrellos_install_dismissed'));

  if (dismissed || isInstalled || !isMobile) return null;
  if (!isInstallable && !isIOS) return null;

  function dismiss() {
    localStorage.setItem('terrellos_install_dismissed', '1');
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-16 left-3 right-3 z-40 sm:hidden">
      <div className="card-glass rounded-2xl p-4 border border-primary/30 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg gradient-purple-blue flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Install TerrellOS</div>
            {isIOS ? (
              <div className="text-xs text-muted-foreground mt-0.5">
                Tap <strong className="text-foreground">Share</strong> → <strong className="text-foreground">Add to Home Screen</strong> for the full app experience.
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-0.5">
                Install for offline access, push notifications, and native mobile experience.
              </div>
            )}
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        {!isIOS && isInstallable && (
          <button
            onClick={async () => { await promptInstall(); dismiss(); }}
            className="mt-3 w-full py-2 rounded-lg gradient-purple-blue text-white text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Install App
          </button>
        )}
      </div>
    </div>
  );
}