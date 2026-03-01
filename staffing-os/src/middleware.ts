import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { applyRateLimit } from "@/lib/rate-limit"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isLoginPage = req.nextUrl.pathname === "/login"
  const isApiRoute = req.nextUrl.pathname.startsWith("/api")

  // Rate Limiting (5 requests per minute per IP for Login & API)
  if (isLoginPage || (isApiRoute && !req.nextUrl.pathname.startsWith("/api/health"))) {
    const rateLimitResponse = applyRateLimit(req, { limit: 10, windowMs: 60 * 1000 })
    if (rateLimitResponse) return rateLimitResponse
  }

  // Allow API routes
  if (isApiRoute) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Redirect to dashboard if already logged in and on login page
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts).*)"],
}
