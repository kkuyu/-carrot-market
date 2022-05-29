import React from "react";
import Link from "next/link";

import { cls } from "../libs/utils";

interface LayoutProps {
  title?: string;
  canGoBack?: boolean;
  hasTabBar?: boolean;
  children: React.ReactNode;
}

export default function Layout({ title, canGoBack, hasTabBar, children }: LayoutProps) {
  return (
    <div>
      <header className="fixed top-0 left-0 w-full">
        <div className="mx-auto w-full max-w-xl border-b bg-white">
          <div className="flex items-center justify-center w-full h-14">
            <strong className="text-base font-semibold">{title}</strong>
          </div>
        </div>
      </header>
      <div className={cls("container", "pt-14", hasTabBar ? "pb-14" : "")}>{children}</div>
      {hasTabBar ? (
        <nav className="fixed bottom-0 left-0 w-full">
          <div className="mx-auto w-full max-w-xl border-t bg-white">
            <div className="flex items-center justify-between w-full h-14">
              <Link href="/">
                <a>link1</a>
              </Link>
              <Link href="/">
                <a>link2</a>
              </Link>
              <Link href="/">
                <a>link3</a>
              </Link>
            </div>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
