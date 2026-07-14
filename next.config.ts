import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Config options here
};

export default withSentryConfig(nextConfig, {
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
