import { NextMiddleware, userAgent } from "next/server";
import { NextResponse } from "next/server";

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
      case "/welcome/locate":
      case "/login":
      case "/join":
      case "/verification/email":
      case "/verification/phone":
        return NextResponse.next();
      default:
        if (/^\/products\/\w*$/.test(url.pathname)) return NextResponse.next();
        if (/^\/stories\/\w*$/.test(url.pathname)) return NextResponse.next();
        if (/^\/comments\/\w*$/.test(url.pathname)) return NextResponse.next();
        if (/^\/users\/profiles\/\w*/.test(url.pathname)) return NextResponse.next();
        url.pathname = "/welcome";
        url.search = "";
        return NextResponse.redirect(url);
    }
  }

  if (isLogin) {
    switch (url.pathname) {
      case "/welcome":
      case "/welcome/locate":
      case "/login":
      case "/join":
      case "/verification/email":
      case "/verification/phone":
        url.pathname = "/";
        url.search = "";
        return NextResponse.redirect(url);
      default:
        return NextResponse.next();
    }
  }

  return NextResponse.next();
};
