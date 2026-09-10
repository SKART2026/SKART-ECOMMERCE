import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export async function proxy(request: Request) {
  const url = new URL(request.url);

  // Admin login must always remain accessible.
  if (url.pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Only protect /admin and everything underneath it.
  if (!url.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (!JWT_SECRET) {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  const cookieHeader = request.headers.get("cookie") || "";

  const token = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) =>
      cookie.startsWith("shopkart_token=")
    )
    ?.substring("shopkart_token=".length);

  if (!token) {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    const role = String(payload.role || "");

    if (role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};