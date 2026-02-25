import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };
interface InstallAppCardProps {
  className?: string;
}

const isMobileUserAgent = (value: string) => /Android|iPhone|iPad|iPod/i.test(value);
const isIosUserAgent = (value: string) => /iPhone|iPad|iPod/i.test(value);

export const InstallAppCard = ({ className }: InstallAppCardProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const userAgent = typeof window === "undefined" ? "" : window.navigator.userAgent;
  const isMobile = useMemo(() => isMobileUserAgent(userAgent), [userAgent]);
  const isIos = useMemo(() => isIosUserAgent(userAgent), [userAgent]);

  useEffect(() => {
    if (!isMobile) return;

    const syncInstallState = () => {
      const standaloneDisplay = window.matchMedia("(display-mode: standalone)").matches;
      const standaloneIos = (window.navigator as NavigatorWithStandalone).standalone === true;
      setIsInstalled(standaloneDisplay || standaloneIos);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setStatusMessage("MadFood is installed on your device.");
    };

    syncInstallState();

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [isMobile]);

  const onInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    setStatusMessage(null);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setStatusMessage("Install started. You can open MadFood from your home screen.");
      } else {
        setStatusMessage("Install dismissed. You can try again anytime.");
      }
    } finally {
      setDeferredPrompt(null);
      setInstalling(false);
    }
  };

  if (!isMobile || isInstalled) return null;

  return (
    <Card className={["max-w-620", className].filter(Boolean).join(" ")}>
      <div className="stack">
        <div className="section-head mb-0">
          <h2>Install MadFood</h2>
        </div>
        <p className="muted">Save MadFood to your home screen for quick access like a native app.</p>

        {deferredPrompt ? (
          <div className="inline-row">
            <Button type="button" onClick={onInstall} loading={installing}>
              Install app
            </Button>
          </div>
        ) : null}

        {!deferredPrompt && isIos ? (
          <p className="help-text">On iPhone/iPad Safari: tap Share, then tap Add to Home Screen.</p>
        ) : null}

        {!deferredPrompt && !isIos ? (
          <p className="help-text">Open your browser menu and select Install app or Add to Home screen.</p>
        ) : null}

        {statusMessage ? <p className="help-text">{statusMessage}</p> : null}
      </div>
    </Card>
  );
};
