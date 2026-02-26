import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./app/App";
import { initInstallPromptStore } from "./features/pwa/installPromptStore";
import "./styles/tokens.css";
import "./styles/globals.css";
import "./styles/components.css";

initInstallPromptStore();
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
