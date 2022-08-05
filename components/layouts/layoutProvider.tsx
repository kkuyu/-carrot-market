import React, { useState, useMemo } from "react";
// @components
import { LayoutDispatch, LayoutState } from "@components/layouts";
import { LayoutDispatchContext, LayoutStateContext } from "@components/layouts/layoutContext";
import HeaderWrapper from "@components/layouts/header/headerWrapper";
import NavBarWrapper from "@components/layouts/navBar/navBarWrapper";

const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentState, setCurrentState] = useState<LayoutState>({
    header: {
      utils: [],
    },
    navBar: {
      utils: [],
    },
  });

  const change: LayoutDispatch["change"] = (options) => {
    setCurrentState(() => ({
      ...options,
    }));
  };

  const reset: LayoutDispatch["reset"] = () => {
    setCurrentState(() => ({
      header: {
        utils: [],
      },
      navBar: {
        utils: [],
      },
    }));
  };

  const dispatch = useMemo(() => ({ change, reset }), []);

  return (
    <LayoutStateContext.Provider value={currentState}>
      <LayoutDispatchContext.Provider value={dispatch}>
        <HeaderWrapper />
        {children}
        <NavBarWrapper />
      </LayoutDispatchContext.Provider>
    </LayoutStateContext.Provider>
  );
};

export default LayoutProvider;
