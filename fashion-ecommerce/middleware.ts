import { NextResponse, type NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // Check for token in localStorage is not possible in middleware
    // We'll check in the page component, but we can redirect if needed
    // For now, let the page handle authentication
    return NextResponse.next()
  }
  
  // Protect employee routes
  if (pathname.startsWith('/employee')) {
    // Same as admin - let page handle authentication
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/profile/:path*"],
}


