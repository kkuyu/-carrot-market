import { useRouter } from "next/router";
import Link from "next/link";
import type { HTMLAttributes } from "react";
// @libs
import { NavBarOptions, NavBarUtils } from "@components/layouts/navBar/navBarWrapper";

export interface NavBarProps extends NavBarOptions {}

const NavBar = (props: NavBarProps) => {
  const { utils = [] } = props;
  const router = useRouter();

  const IconButton = (buttonProps: HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> & { pathname: string; children: JSX.Element }) => {
    const { pathname, children } = buttonProps;
    const classNames = {
      wrapper: "basis-full h-full pt-2",
      icon: "[&>svg]:m-auto [&>svg]:w-5 [&>svg]:h-5",
      span: "[&>span]:block [&>span]:mt-0.5 [&>span]:text-sm [&>span]:text-center",
    };
    return (
      <Link href={pathname}>
        <a className={`${classNames.wrapper} ${classNames.icon} ${classNames.span} ${router.pathname === pathname ? "text-orange-500" : "hover:text-gray-500 transition-colors"}`}>{children}</a>
      </Link>
    );
  };

  const getUtils = (name: NavBarUtils) => {
    if (!utils?.includes(name)) return null;
    switch (name) {
      case "home":
        return (
          <IconButton pathname="/">
            <>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                ></path>
              </svg>
              <span>홈</span>
            </>
          </IconButton>
        );
      case "chat":
        return (
          <IconButton pathname="/chats">
            <>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
              <span>채팅</span>
            </>
          </IconButton>
        );
      case "profile":
        return (
          <IconButton pathname="/user">
            <>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span>나의 당근</span>
            </>
          </IconButton>
        );
      case "story":
        return (
          <IconButton pathname="/stories">
            <>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                ></path>
              </svg>
              <span>동네생활</span>
            </>
          </IconButton>
        );
      case "streams":
        return (
          <IconButton pathname="/streams">
            <>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                ></path>
              </svg>
              <span>스트리밍</span>
            </>
          </IconButton>
        );
      default:
        return null;
    }
  };

  if (!utils?.length) return null;

  return (
    <div id="layout-nav-bar" className="fixed-container bottom-0 z-[100]">
      <nav className="fixed-inner h-14 border-t bg-white">
        <div className="-mb-1 flex w-full h-full">
          {getUtils(NavBarUtils["Home"])}
          {getUtils(NavBarUtils["Story"])}
          {getUtils(NavBarUtils["Chat"])}
          {getUtils(NavBarUtils["Streams"])}
          {getUtils(NavBarUtils["Profile"])}
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
