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

  const CustomIconButton = (buttonProps: HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> & { pathname: string }) => {
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

  if (!utils?.length) return null;

  return (
    <div id="layout-nav-bar" className="fixed-container bottom-0 z-[100]">
      <nav className="fixed-inner h-14 border-t bg-white">
        <div className="-mb-1 flex w-full h-full">
          {utils?.includes(NavBarUtils["Home"]) && (
            <CustomIconButton pathname="/">
              <Icons name="Home" />
              <span>홈</span>
            </CustomIconButton>
          )}
          {utils?.includes(NavBarUtils["Story"]) && (
            <CustomIconButton pathname="/stories">
              <Icons name="Newspaper" />
              <span>동네생활</span>
            </CustomIconButton>
          )}
          {utils?.includes(NavBarUtils["Chat"]) && (
            <CustomIconButton pathname="/chats">
              <Icons name="ChatBubbleLeftRight" />
              <span>채팅</span>
            </CustomIconButton>
          )}
          {utils?.includes(NavBarUtils["Streams"]) && (
            <CustomIconButton pathname="/streams">
              <Icons name="VideoCamera" />
              <span>스트리밍</span>
            </CustomIconButton>
          )}
          {utils?.includes(NavBarUtils["Profile"]) && (
            <CustomIconButton pathname="/user">
              <Icons name="User" />
              <span>나의 당근</span>
            </CustomIconButton>
          )}
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
