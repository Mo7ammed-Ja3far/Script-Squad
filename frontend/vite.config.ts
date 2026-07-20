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
  // إعدادات سيرفر التطوير (Development)
  server: {
    allowedHosts: true,
    port: 5175,
    proxy: {
      "/api": {
        target:
          "https://griffin-characteristic-sequence-malpractice.trycloudflare.com",
        changeOrigin: true,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
      "/socket.io": {
        target:
          "https://griffin-characteristic-sequence-malpractice.trycloudflare.com",
        ws: true,
        changeOrigin: true,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
    },
  },
  // إعدادات سيرفر البريفيو (Production Preview)
  preview: {
    allowedHosts: true,
    port: 5175, // تقدر تغير البورت هنا لو مش عايز تعارض مع الـ dev server
    proxy: {
      "/api": {
        target:
          "https://griffin-characteristic-sequence-malpractice.trycloudflare.com",
        changeOrigin: true,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
      "/socket.io": {
        target:
          "https://griffin-characteristic-sequence-malpractice.trycloudflare.com",
        ws: true,
        changeOrigin: true,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
    },
  },
});
