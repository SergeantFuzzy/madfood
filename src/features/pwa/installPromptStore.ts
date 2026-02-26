export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type PromptListener = (event: BeforeInstallPromptEvent | null) => void;
type InstalledListener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
const promptListeners = new Set<PromptListener>();
const installedListeners = new Set<InstalledListener>();

const notifyPromptListeners = () => {
  promptListeners.forEach((listener) => listener(deferredPrompt));
};

export const initInstallPromptStore = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifyPromptListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyPromptListeners();
    installedListeners.forEach((listener) => listener());
  });
};

export const getDeferredInstallPrompt = () => deferredPrompt;

export const clearDeferredInstallPrompt = () => {
  deferredPrompt = null;
  notifyPromptListeners();
};

export const subscribeDeferredInstallPrompt = (listener: PromptListener) => {
  promptListeners.add(listener);
  listener(deferredPrompt);

  return () => {
    promptListeners.delete(listener);
  };
};

export const subscribeAppInstalled = (listener: InstalledListener) => {
  installedListeners.add(listener);

  return () => {
    installedListeners.delete(listener);
  };
};
