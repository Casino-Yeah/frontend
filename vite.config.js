import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Código compartido con el backend (motor de física del Billar)
    // Vive en el repositorio "backend" (carpeta vecina); en Docker se monta en /app/backend/shared
    alias: { '@shared': process.env.SHARED_DIR ?? fileURLToPath(new URL('../backend/shared', import.meta.url)) },
  },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    // En Docker (sobre todo Docker Desktop) los cambios de archivos no siempre llegan al contenedor
    watch: process.env.WATCH_POLLING === 'true' ? { usePolling: true, interval: 300 } : undefined,
    proxy: {
      '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000', changeOrigin: true },
    },
  },
});
