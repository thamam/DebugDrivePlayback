import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Use process.cwd() as base directory - most reliable across all environments
const rootDir = process.cwd();

export default defineConfig(async () => {
  // Load plugins conditionally
  const plugins = [
    react(),
    runtimeErrorOverlay(),
  ];

  // Only add cartographer plugin in Replit environment
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const cartographerModule = await import("@replit/vite-plugin-cartographer");
      plugins.push(cartographerModule.cartographer());
    } catch (err) {
      // Ignore if cartographer is not available
      console.warn("Replit cartographer plugin not available:", err);
    }
  }

  return {
    plugins,
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "client", "src"),
      "@shared": path.resolve(rootDir, "shared"),
      "@assets": path.resolve(rootDir, "attached_assets"),
      "react": path.resolve(rootDir, "node_modules", "react"),
      "react-dom": path.resolve(rootDir, "node_modules", "react-dom"),
    },
  },
  root: path.resolve(rootDir, "client"),
  build: {
    outDir: path.resolve(rootDir, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  };
});
