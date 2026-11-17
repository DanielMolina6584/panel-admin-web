import { NextResponse, type NextRequest } from "next/server";

/**
 * Capa 1 (comodidad, NO seguridad): redirige a /login si falta la cookie.
 * La verificación real se repite en Server Components, Server Actions y Route Handlers.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("sesion")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/sin-permiso"] };
