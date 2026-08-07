import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base is set for GitHub Pages deployment (repo name "maintenance-ai").
// Change this to "/" if deploying to a custom domain or root path.
export default defineConfig({
  plugins: [react()],
  base: "/maintenance-ai/",
});
