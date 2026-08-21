'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';

export function InstallPrompt() {
  const { showInstallPrompt, setInstallPrompt } = useAppStore();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [setInstallPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstallPrompt(false);
      setDeferredPrompt(null);
    }
  };

  if (!showInstallPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-card border border-border rounded-2xl shadow-xl p-4">
      <button
        onClick={() => { setDismissed(true); setInstallPrompt(false); }}
        className="absolute top-3 right-3 p-1 hover:bg-muted rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-background" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Installer l'app</p>
          <p className="text-xs text-muted-foreground mt-0.5">Accédez rapidement à BÂTI·CI depuis votre écran d'accueil</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleInstall}>
              <Download className="w-3.5 h-3.5 mr-1" /> Installer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setDismissed(true); setInstallPrompt(false); }}>
              Plus tard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
