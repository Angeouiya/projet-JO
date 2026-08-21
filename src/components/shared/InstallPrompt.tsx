'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Download, Share2, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function InstallPrompt() {
  const { showInstallPrompt, showAuthModal, setInstallPrompt } = useAppStore();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [setInstallPrompt]);

  useEffect(() => {
    const mobileMedia = window.matchMedia('(max-width: 767px)');
    const standaloneMedia = window.matchMedia('(display-mode: standalone)');
    const sync = () => {
      setIsMobile(mobileMedia.matches);
      setIsStandalone(standaloneMedia.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    };
    sync();
    mobileMedia.addEventListener('change', sync);
    standaloneMedia.addEventListener('change', sync);
    return () => {
      mobileMedia.removeEventListener('change', sync);
      standaloneMedia.removeEventListener('change', sync);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstallPrompt(false);
      setDeferredPrompt(null);
      return;
    }

    setShowFallback(true);
  };

  const shouldShow = !showAuthModal && !dismissed && !isStandalone && (showInstallPrompt || isMobile);

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-xl border border-border bg-card p-4 shadow-xl sm:left-auto sm:right-4 sm:w-80 md:hidden">
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          setInstallPrompt(false);
        }}
        className="absolute top-3 right-3 p-1 hover:bg-muted rounded-lg"
        aria-label="Fermer l'installation"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-background" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Installer l'app</p>
          <p className="text-xs text-muted-foreground mt-0.5">Accédez rapidement à Buildify depuis votre écran d'accueil</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleInstall}>
              <Download className="w-3.5 h-3.5 mr-1" /> Installer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              setDismissed(true);
              setInstallPrompt(false);
            }}>
              Plus tard
            </Button>
          </div>
          {showFallback && (
            <div className="mt-3 rounded-lg border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <Share2 className="size-3.5" />
                Installation mobile
              </p>
              <p className="mt-1">Sur iPhone : Partager, puis Sur l'écran d'accueil.</p>
              <p>Sur Android : menu du navigateur, puis Installer l'application.</p>
            </div>
          )}
          {isStandalone && (
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-foreground">
              <CheckCircle2 className="size-3.5" />
              Application installée
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
