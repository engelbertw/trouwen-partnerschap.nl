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

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  
  // Block babs_admin from accessing certain routes
  if (isBlockedRouteForBabsAdmin(req)) {
    const { userId } = await auth();
    
    // Only check role if user is authenticated
    if (userId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const publicMetadata = user.publicMetadata || {};
        const rol = (publicMetadata.rol as string) || '';
        
        // If user is babs_admin, redirect to /babs
        if (rol === 'babs_admin') {
          return Response.redirect(new URL('/babs', req.url));
        }
      } catch (error) {
        console.error('Error checking user role in middleware:', error);
        // On error, allow through (will be checked in page/API route)
      }
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

