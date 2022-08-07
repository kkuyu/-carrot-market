import React, { useState, useMemo } from "react";
// @components
import { LayoutDispatch, LayoutState } from "@components/layouts";
import { LayoutDispatchContext, LayoutStateContext } from "@components/layouts/layoutContext";

const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentState, setCurrentState] = useState<LayoutState>({
    meta: {},
    header: {},
    navBar: {},
  });

  const change: LayoutDispatch["change"] = (options) => {
    setCurrentState((prev) => {
      return {
        meta: { ...prev.meta, ...options.meta },
        header: { ...prev.header, ...options.header },
        navBar: { ...prev.navBar, ...options.navBar },
      };
    });
  };

  const dispatch = useMemo(() => ({ change }), []);

  return (
    <LayoutStateContext.Provider value={currentState}>
      <LayoutDispatchContext.Provider value={dispatch}>{children}</LayoutDispatchContext.Provider>
    </LayoutStateContext.Provider>
  );
};

export default LayoutProvider;
