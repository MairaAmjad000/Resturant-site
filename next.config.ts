import type { NextConfig } from "next";

/**
 * `output: "standalone"` produces a minimal .next/standalone bundle for Docker.
 * It is enabled ONLY when building inside Docker (via the BUILD_STANDALONE env
 * var set in the Dockerfile), so local `npm run dev` / `next build` and Vercel
 * deployments keep their default behaviour.
 */
const nextConfig: NextConfig = {
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
