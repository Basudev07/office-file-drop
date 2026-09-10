import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Listen on all network interfaces for local office Wi-Fi QR scanning
    allowedHosts: true, // Allow ngrok tunnels, local domains, and external hostnames
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          utils: ['jszip', 'qrcode', 'canvas-confetti'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
