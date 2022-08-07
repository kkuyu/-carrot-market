import { createContext } from "react";
// @components
import { LayoutDispatch, LayoutState } from "@components/layouts";

export const LayoutDispatchContext = createContext<LayoutDispatch>({
  change: (state) => {},
});

export const LayoutStateContext = createContext<LayoutState>({
  meta: {},
  header: {},
  navBar: {},
});
