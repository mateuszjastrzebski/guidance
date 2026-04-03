import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Wyklucz całe `/_next/*` (nie tylko static/image) — inaczej middleware
    // odpala się m.in. na HMR / wewnętrzne requesty Next i potrafi „zepsuć” dev oraz zasoby.
    "/((?!_next/|[^/]+\\.(?:ico|svg|png|jpg|jpeg|gif|webp)$|sw\\.js).*)"
  ]
};
