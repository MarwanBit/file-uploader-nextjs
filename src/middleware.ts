import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";

// const isProtectedRoute = createRouteMatcher(["/folders(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/login(.*)", "/signup(.*)", "/folders/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    // if (!isPublicRoute(req)) {
    //     await auth.protect();
    // }
    // if(isProtectedRoute(req)) {
    //     await auth.protect();
    // }
    // const { userId, redirectToSignIn } = await auth(); 

    // if (isAdminRoute(req) && (await auth()).sessionClaims?.metadata?.role !== "admin") {
    //     const url = new URL("/", req.url);
    //     return NextResponse.redirect(url);
    // }

    // if (!userId && !isPublicRoute(req)) {
    //     return redirectToSignIn();
    // }
    const { userId } = await auth();

    if (!userId && !isPublicRoute(req)) {
      const url = new URL("/login", req.url);
      return NextResponse.redirect(url);
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