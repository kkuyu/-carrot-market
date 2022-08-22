import { useRouter } from "next/router";
import Link from "next/link";
import type { HTMLAttributes } from "react";
// @libs
import { NavBarOptions, NavBarUtils } from "@components/layouts/navBar/navBarWrapper";
import Icons from "@components/icons";

export interface NavBarProps extends NavBarOptions {}

const NavBar = (props: NavBarProps) => {
  const { utils = [] } = props;
  const router = useRouter();

  const IconButton = (buttonProps: HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> & { pathname: string }) => {
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
            <Icons name="Home" />
            <span>홈</span>
          </IconButton>
        );
      case "chat":
        return (
          <IconButton pathname="/chats">
            <Icons name="ChatBubbleLeftRight" />
            <span>채팅</span>
          </IconButton>
        );
      case "profile":
        return (
          <IconButton pathname="/user">
            <Icons name="User" />
            <span>나의 당근</span>
          </IconButton>
        );
      case "story":
        return (
          <IconButton pathname="/stories">
            <Icons name="Newspaper" />
            <span>동네생활</span>
          </IconButton>
        );
      case "streams":
        return (
          <IconButton pathname="/streams">
            <Icons name="VideoCamera" />
            <span>스트리밍</span>
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
