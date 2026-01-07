import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Route protection logic
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");

  // For dashboard routes, refresh session to get latest JWT claims (org_id, org_role)
  // For other routes, just validate with getUser() for performance
  let user = null;
  if (isProtectedRoute) {
    const { data } = await supabase.auth.refreshSession();
    user = data.session?.user ?? null;
  } else {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  // Redirect unauthenticated users from protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("op", "login");
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth routes (except callback)
  if (user && isAuthRoute && !request.nextUrl.pathname.includes("/callback")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
