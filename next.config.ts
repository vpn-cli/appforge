import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: {
    position: "bottom-right",
  },
};

export default withAnalyzer(
  withSentryConfig(nextConfig, {
    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    tunnelRoute: "/monitoring",
  })
);

