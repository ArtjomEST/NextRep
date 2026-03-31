import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Use this project directory as root (avoids wrong root when multiple lockfiles exist, e.g. pnpm-lock.yaml in parent).
    root: path.resolve(process.cwd()),
  },
  // pdfkit loads font files from its own package directory at runtime via __dirname.
  // Bundling it breaks those paths, so we keep it as a native Node.js external.
  serverExternalPackages: ['pdfkit'],
};

export default nextConfig;
