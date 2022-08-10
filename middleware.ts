import { NextMiddleware, NextResponse, userAgent } from "next/server";

export const middleware: NextMiddleware = (req) => {
  if (req.url.includes("/api")) return;
  if (req.url.includes("/_next")) return;

  const ua = userAgent(req);
  if (ua.isBot) return new NextResponse(null, { status: 403 });

  const url = req.nextUrl.clone();
  const hasCookie = Boolean(req.cookies.get("carrot-market-session"));

  if (!hasCookie) {
    switch (url.pathname) {
      case "/welcome":
      case "/welcome/locate":
      case "/account/join":
      case "/account/login":
      case "/account/logout":
      case "/verification/email":
      case "/verification/phone":
        return NextResponse.next();
      default:
        if (/^\/products\/\w*$/.test(url.pathname)) return NextResponse.next();
        if (/^\/stories\/\w*$/.test(url.pathname)) return NextResponse.next();
        if (/^\/comments\/\w*$/.test(url.pathname)) return NextResponse.next();
        if (/^\/profiles\/.*$/.test(url.pathname)) return NextResponse.next();
        url.pathname = "/welcome";
        url.search = "";
        return NextResponse.redirect(url);
    }
  }

  if (hasCookie) {
    switch (url.pathname) {
      case "/welcome":
      case "/welcome/locate":
      case "/account/join":
      case "/account/login":
      // case "/account/logout":
      case "/verification/email":
      case "/verification/phone":
        url.pathname = "/";
        url.search = "";
        return NextResponse.redirect(url);
      default:
        return NextResponse.next();
    }
  }
};
