import React, { useContext, useMemo } from "react";
// @components
import { LayoutDispatchContext, LayoutStateContext } from "@components/layouts/layoutContext";
import NavBarContainer from "@components/layouts/navBar/navBarContainer";

const NavBarWrapper = () => {
  const currentState = useContext(LayoutStateContext);
  const { change, reset } = useContext(LayoutDispatchContext);

  const currentNavBar = useMemo(() => currentState.navBar, [currentState]);

  return <NavBarContainer {...currentNavBar} />;
};

export default NavBarWrapper;
