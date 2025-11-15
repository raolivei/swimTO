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
        // In docker-compose, use the API service name; locally use localhost
        // If VITE_API_URL is set, use it; otherwise use docker service name (works in docker-compose)
        // For local dev without docker, set VITE_API_URL=http://localhost:8000
        target: process.env.VITE_API_URL || "http://api:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Add trailing slash to paths that need it (FastAPI routes)
            const url = req.url || '';
            if (url.match(/^\/(schedule|facilities)(\?.*)?$/)) {
              const [path, query] = url.split('?');
              proxyReq.path = path + '/' + (query ? '?' + query : '');
            }
          });
        },
      },
    },
  },
  preview: {
    host: true,
    port: 3000,
    strictPort: false,
    allowedHosts: ["swimto.eldertree.local", "swimto.local", "localhost"],
  },
});
