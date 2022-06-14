import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// const protectedRoutes = [
//   { path: "/profile", redirect: "/enter" },
//   { path: "/product/upload", redirect: "/enter" },
//   { path: "/inbox", redirect: "/enter" },
//   { path: "/community/write", redirect: "/enter" },
//   { path: "/stream/create", redirect: "/enter" },
// ];

export const middleware = (req: NextRequest) => {
  const url = req.nextUrl.clone();

  if (req.url.includes("/api")) return;
  if (req.url.includes("/_next")) return;

  const isLogin = Boolean(req.cookies.get("carrot-market-session"));
  if (!isLogin && url.pathname !== "/enter") {
    url.pathname = "/enter";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
};
