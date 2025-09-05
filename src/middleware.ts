import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Get the pathname from the request
  const path = req.nextUrl.pathname;
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/', '/api/auth/login', '/api/health'];
  
  // Define admin-only routes
  const adminRoutes = ['/admin', '/dashboard', '/archived', '/settings', '/reports', '/backup', '/users', '/activities'];
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith('/api/') || path.startsWith('/_next/') || path.startsWith('/favicon')
  );
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Check for authentication token
  const authToken = req.cookies.get('authToken')?.value || 
                   req.headers.get('authorization')?.replace('Bearer ', '');
  
  // If no auth token, redirect to login
  if (!authToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check if user is trying to access admin routes
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));
  
  if (isAdminRoute) {
    // Check user role from cookies
    const userRole = req.cookies.get('userRole')?.value;
    
    // If user is not admin, redirect to projects page
    if (userRole !== 'ADMIN') {
      const projectsUrl = new URL('/projects', req.url);
      return NextResponse.redirect(projectsUrl);
    }
  }
  
  // If authenticated and authorized, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

