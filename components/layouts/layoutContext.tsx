import { createContext } from "react";
// @components
import { LayoutDispatch, LayoutState } from "@components/layouts";

export const LayoutDispatchContext = createContext<LayoutDispatch>({
  change: (state) => {},
  reset: () => {},
});

export const LayoutStateContext = createContext<LayoutState>({
  header: {
    utils: [],
  },
  navBar: {
    utils: [],
  },
});
