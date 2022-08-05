import React, { useContext, useMemo } from "react";
// @components
import { LayoutDispatchContext, LayoutStateContext } from "@components/layouts/layoutContext";
import HeaderContainer from "@components/layouts/header/headerContainer";

const HeaderWrapper = () => {
  const currentState = useContext(LayoutStateContext);
  const { change, reset } = useContext(LayoutDispatchContext);

  const currentHeader = useMemo(() => ({  ...currentState.header }), [currentState]);

  return <HeaderContainer {...currentHeader} />;
};

export default HeaderWrapper;
