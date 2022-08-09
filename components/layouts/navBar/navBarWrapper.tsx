import React, { useContext, useEffect, useMemo } from "react";
// @components
import { LayoutDispatchContext, LayoutStateContext } from "@components/layouts/layoutContext";
import NavBarContainer from "@components/layouts/navBar/navBarContainer";

export const NavBarUtils = {
  Home: "home",
  Chat: "chat",
  Profile: "profile",
  Story: "story",
  Streams: "streams",
} as const;
export type NavBarUtils = typeof NavBarUtils[keyof typeof NavBarUtils];

export interface NavBarOptions {
  utils?: NavBarUtils[];
}

interface NavBarWrapperProps {
  defaultNavBarState: NavBarOptions | null;
}

const NavBarWrapper = ({ defaultNavBarState }: NavBarWrapperProps) => {
  const currentState = useContext(LayoutStateContext);
  const { change } = useContext(LayoutDispatchContext);

  const currentNavBar = useMemo(() => ({ ...currentState.navBar }), [currentState]);

  useEffect(() => {
    if (!defaultNavBarState) return;
    change({
      meta: {},
      header: {},
      navBar: {
        utils: [],
        ...defaultNavBarState,
      },
    });
  }, [defaultNavBarState]);

  return <NavBarContainer {...defaultNavBarState} {...currentNavBar} />;
};

export default NavBarWrapper;
