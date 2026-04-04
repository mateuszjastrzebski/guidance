import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    // Tylko trasy, które muszą odświeżyć sesję Supabase. Unikamy odpalania
    // middleware na `/` i `/login` — w dev potrafi to psuć RSC/streaming (pusta strona).
    "/auth/callback",
    "/dashboard/:path*",
    "/campaign/:path*",
    "/campaigns/:path*"
  ]
};
