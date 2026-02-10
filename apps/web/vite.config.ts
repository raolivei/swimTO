import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        // For local dev: proxy to production API (default)
        // For docker-compose: set VITE_API_URL=http://api:8000
        target: process.env.VITE_API_URL || "https://api.swimto.app",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
    host: true,
    port: 3000,
    strictPort: false,
    // Disable strict host checking for production (behind reverse proxy/ingress)
    // Security is handled by Kubernetes ingress/TLS, not by Vite
    strictHost: false,
    allowedHosts: [
      "swimto.eldertree.local",
      "swimto.eldertree.xyz",
      "swimto.local",
      "pihole.eldertree.local",
      "grafana.eldertree.local",
      "prometheus.eldertree.local",
      "vault.eldertree.local",
      "flux-ui.eldertree.local",
      "localhost",
    ],
  },
});
