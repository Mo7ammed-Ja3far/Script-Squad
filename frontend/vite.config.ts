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
        target: "https://f56f-162-55-178-223.ngrok-free.app",
        changeOrigin: true,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
      "/socket.io": {
        target: "https://f56f-162-55-178-223.ngrok-free.app",
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
        target: "https://f56f-162-55-178-223.ngrok-free.app",
        changeOrigin: true,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
      "/socket.io": {
        target: "https://f56f-162-55-178-223.ngrok-free.app",
        ws: true,
        changeOrigin: true,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
    },
  },
});
