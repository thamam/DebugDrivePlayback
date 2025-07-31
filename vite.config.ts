import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Handle different environments for __dirname - with better error handling
let __dirname;
try {
  if (import.meta && import.meta.url) {
    const __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
  } else {
    throw new Error("import.meta.url not available");
  }
} catch (err) {
  // Fallback for environments where import.meta might not work properly
  console.warn("Using process.cwd() fallback for __dirname:", err instanceof Error ? err.message : String(err));
  __dirname = process.cwd();
}

console.log("Vite config __dirname:", __dirname);

// Additional safety check
if (!__dirname || typeof __dirname !== 'string') {
  throw new Error(`Invalid __dirname: ${__dirname}`);
}

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    // Removed dynamic Replit plugin import to avoid issues
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      "react": path.resolve(__dirname, "node_modules", "react"),
      "react-dom": path.resolve(__dirname, "node_modules", "react-dom"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist", "public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
