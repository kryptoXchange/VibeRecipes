import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic check only (cookie present). The signature is verified in getCurrentUser().
export function proxy(request: NextRequest) {
  if (!request.cookies.has("session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/recipes/new", "/admin/:path*", "/review/:path*", "/api/clips"],
};
