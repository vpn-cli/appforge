import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  '/', 
  '/templates(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/builder/template-(.*)',
  '/api/copilot(.*)',
  '/api/webhooks/clerk(.*)', 
]);

export default clerkMiddleware(async (auth, request) => {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
