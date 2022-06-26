import { NextMiddleware, userAgent } from "next/server";
import { NextResponse } from "next/server";

// const protectedRoutes = [
//   { path: "/profile", redirect: "/enter" },
//   { path: "/product/upload", redirect: "/enter" },
//   { path: "/inbox", redirect: "/enter" },
//   { path: "/community/write", redirect: "/enter" },
//   { path: "/streams/create", redirect: "/enter" },
// ];

export const middleware: NextMiddleware = (req) => {
  if (req.url.includes("/api")) return NextResponse.next();
  if (req.url.includes("/_next")) return NextResponse.next();

  const ua = userAgent(req);
  if (ua.isBot) {
    return new NextResponse(null, { status: 403 });
  }

  const url = req.nextUrl.clone();
  const isLogin = Boolean(req.cookies.get("carrot-market-session"));

  if (!isLogin) {
    switch (url.pathname) {
      case "/welcome":
      case "/login":
      case "/verification-email":
      case "/verification-phone":
      case "/hometown/search":
      case "/join":
        return NextResponse.next();
      default:
        url.pathname = "/welcome";
        return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
};
