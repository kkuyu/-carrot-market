import { createContext } from "react";

import { CommonDispatch, CommonState } from "@components/commons";

export const CommonDispatchContext = createContext<CommonDispatch>({
  open: (Type, Component, name, props) => {},
  close: (Type, Component, name) => {},
});

export const CommonStateContext = createContext<CommonState>(
  new Map([
    ["Modal", []],
    ["Panel", []],
    ["Toast", []],
  ])
);
