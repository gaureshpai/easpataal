import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname.startsWith("/doctor") && token?.role !== "DOCTOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname.startsWith("/pharmacist") && token?.role !== "PHARMACIST") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname.startsWith("/receptionist") && token?.role !== "RECEPTIONIST") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/pharmacist/:path*", "/receptionist/:path*", "/profile-settings/:path*"],
};
