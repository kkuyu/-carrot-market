import { NextRequest, userAgent } from "next/server";
import { NextResponse } from "next/server";

// const protectedRoutes = [
//   { path: "/profile", redirect: "/enter" },
//   { path: "/product/upload", redirect: "/enter" },
//   { path: "/inbox", redirect: "/enter" },
//   { path: "/community/write", redirect: "/enter" },
//   { path: "/streams/create", redirect: "/enter" },
// ];

export const middleware = (req: NextRequest) => {
  if (req.url.includes("/api")) return;
  if (req.url.includes("/_next")) return;

  const ua = userAgent(req);
  if (ua.isBot) {
    return new NextResponse(null, { status: 403 });
  }

  const url = req.nextUrl.clone();
  const isLogin = Boolean(req.cookies.get("carrot-market-session"));
  if (!isLogin && url.pathname !== "/enter") {
    url.pathname = "/enter";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
};
