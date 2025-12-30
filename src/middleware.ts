import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/api/webhooks(.*)',
]);

// Define routes that babs_admin should NOT access
const isBlockedRouteForBabsAdmin = createRouteMatcher([
  '/000-aankondiging(.*)',
  '/aankondiging(.*)',
  '/api/aankondiging(.*)',
  '/gemeente(.*)',
  '/api/gemeente(.*)',
  '/', // Home page
]);

// Helper function to check if path is a BABS calendar route
function isBabsCalendarRoute(pathname: string): boolean {
  // Match /gemeente/beheer/babs/[babsId]/calendar
  const calendarPattern = /^\/gemeente\/beheer\/babs\/[^/]+\/calendar/;
  if (calendarPattern.test(pathname)) {
    return true;
  }
  
  // Match API routes for BABS calendar
  const apiPattern = /^\/api\/gemeente\/babs\/[^/]+\/(recurring-rules|blocked-dates|audit-log|ceremonies)/;
  return apiPattern.test(pathname);
}

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  
  const { userId } = await auth();
  
  // Only check user if authenticated
  if (userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const publicMetadata = user.publicMetadata || {};
      const rol = (publicMetadata.rol as string) || '';
      
      // Redirect hb_admin users to gemeente beheer
      if (rol === 'hb_admin') {
        // If on root or dashboard, redirect to gemeente beheer
        if (req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/dashboard') {
          return Response.redirect(new URL('/gemeente/beheer', req.url));
        }
      }
      
      // Block babs_admin from accessing certain routes (unless it's an allowed exception)
      if (isBlockedRouteForBabsAdmin(req)) {
        // If user is babs_admin, check if this is an allowed route
        if (rol === 'babs_admin') {
          // Allow access to BABS calendar routes
          if (isBabsCalendarRoute(req.nextUrl.pathname)) {
            // Allow through - this is an exception
            return;
          }
          // Otherwise, redirect to /babs
          return Response.redirect(new URL('/babs', req.url));
        }
      }
    } catch (error) {
      console.error('Error checking user role in middleware:', error);
      // On error, allow through (will be checked in page/API route)
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

