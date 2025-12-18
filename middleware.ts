import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  if (!user) {
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  let role = user.app_metadata?.role;

  // Fetch role from DB if missing in JWT
  if (!role) {
    const { data: roleData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
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
