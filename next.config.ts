import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Use this project directory as root (avoids wrong root when multiple lockfiles exist, e.g. pnpm-lock.yaml in parent).
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
