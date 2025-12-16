import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // FIX: createMiddlewareClient handles the cookie adapter internally
  const supabase = createMiddlewareClient({ req, res });

  // Automatically refreshes expired access tokens
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Public routes allowed
  if (pathname.startsWith("/auth") || pathname.startsWith("/403")) {
    return res;
  }

  // Protected routes
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/owner");

  if (!isProtected) return res;

  // Not logged in → redirect
  if (!session) {
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  let role = session.user.app_metadata?.role;

  // Fetch role from DB if missing in JWT
  if (!role) {
    const { data: roleData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    role = roleData?.role ?? null;
  }

  console.log("🔐 Middleware role:", role);

  // block wrong roles
  if (pathname.startsWith("/admin") && !["admin", "superadmin"].includes(role)) {
    url.pathname = "/403";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/owner") && role !== "owner") {
    url.pathname = "/402";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/owner/:path*"],
};
