import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
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
interface ConfettiPiece {
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  color: string;
  round: boolean;
}

const isMobileUserAgent = (value: string) => /Android|iPhone|iPad|iPod/i.test(value);
const confettiColors = ["#f7accd", "#f28ab8", "#ec6da7", "#f9c6de", "#ffdfec"];

export const InstallAppCard = ({ className }: InstallAppCardProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const confettiTimerRef = useRef<number | null>(null);

  const userAgent = typeof window === "undefined" ? "" : window.navigator.userAgent;
  const isMobile = useMemo(() => isMobileUserAgent(userAgent), [userAgent]);
  const confettiPieces = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        left: (index * 17) % 100,
        size: 8 + (index % 4) * 3,
        delay: (index % 8) * 65,
        duration: 1800 + (index % 6) * 220,
        drift: ((index % 7) - 3) * 18,
        rotate: (index * 37) % 360,
        color: confettiColors[index % confettiColors.length],
        round: index % 3 === 0
      })),
    []
  );

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

  useEffect(
    () => () => {
      if (confettiTimerRef.current) {
        window.clearTimeout(confettiTimerRef.current);
      }
    },
    []
  );

  const launchConfetti = () => {
    setBurstKey((value) => value + 1);
    setShowConfetti(true);
    if (confettiTimerRef.current) {
      window.clearTimeout(confettiTimerRef.current);
    }
    confettiTimerRef.current = window.setTimeout(() => setShowConfetti(false), 3200);
  };

  const onInstall = async () => {
    launchConfetti();
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
        <div className="inline-row">
          <Button type="button" className="btn-install-cute" onClick={onInstall} loading={installing}>
            Install on my phone
          </Button>
        </div>

        {statusMessage ? <p className="help-text">{statusMessage}</p> : null}
      </div>
      {showConfetti ? (
        <div className="confetti-rain" key={burstKey} aria-hidden="true">
          {confettiPieces.map((piece, index) => (
            <span
              // Generated once to keep animation stable between renders.
              key={`confetti-${index}`}
              className={["confetti-piece", piece.round ? "round" : ""].filter(Boolean).join(" ")}
              style={
                {
                  left: `${piece.left}%`,
                  width: `${piece.size}px`,
                  height: `${piece.round ? piece.size : piece.size + 4}px`,
                  animationDuration: `${piece.duration}ms`,
                  animationDelay: `${piece.delay}ms`,
                  backgroundColor: piece.color,
                  transform: `translateX(0) rotate(${piece.rotate}deg)`,
                  ["--confetti-drift" as string]: `${piece.drift}px`
                } as CSSProperties
              }
            />
          ))}
        </div>
      ) : null}
    </Card>
  );
};
