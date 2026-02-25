import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/madfood/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.png", "apple-touch-icon.png", "logo-mark.png", "pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "MadFood",
        short_name: "MadFood",
        description: "A sleek meal planner, recipe, and shopping list app",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/madfood/",
        start_url: "/madfood/",
        icons: [
          {
            src: "pwa-192.png?v=20260225",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512.png?v=20260225",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "pwa-512.png?v=20260225",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ]
});
