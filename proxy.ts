import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeNextPath } from "./lib/auth/safeNext";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/painel")) {
    return NextResponse.next();
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next();
  }
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.includes("-auth-token"));
  if (hasSession) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.searchParams.set("next", safeNextPath(pathname));
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/painel/:path*"],
};
