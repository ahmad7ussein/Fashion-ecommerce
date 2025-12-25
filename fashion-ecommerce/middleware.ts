import { NextResponse, type NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  // Server-side route protection intentionally disabled (handled client-side)
  matcher: [],
}

