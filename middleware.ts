import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/templates(.*)",
  "/terms(.*)",
  "/privacy(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/not-found(.*)",
  "/builder/template-(.*)",
  "/builder/demo(.*)",
  "/builder/mock-(.*)",
  "/apps(.*)",
  "/dashboard(.*)",
  "/api/proxy/(.*)",
  "/api/copilot(.*)",
  "/api/health",
  "/api/webhooks/clerk(.*)",
]);

const runClerkMiddleware = clerkMiddleware(async (auth, request) => {
  if (process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true") {
    return;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  // Static public marketing homepage does not need a server-side Clerk handshake redirect
  if (
    request.nextUrl.pathname === "/" &&
    !request.nextUrl.searchParams.has("__clerk_handshake")
  ) {
    return NextResponse.next();
  }

  return runClerkMiddleware(request, event);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
