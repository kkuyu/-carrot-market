import React, { useContext, useEffect, useMemo } from "react";
// @components
import { LayoutDispatchContext, LayoutStateContext } from "@components/layouts/layoutContext";
import HeaderContainer from "@components/layouts/header/headerContainer";

export const HeaderUtils = {
  Address: "address",
  Back: "back",
  Home: "home",
  Kebab: "kebab",
  Share: "share",
  Search: "search",
  Submit: "submit",
  Title: "title",
} as const;
export type HeaderUtils = typeof HeaderUtils[keyof typeof HeaderUtils];

export interface HeaderOptions {
  utils?: HeaderUtils[];
  title?: string;
  titleTag?: "h1" | "strong";
  isTransparent?: boolean;
  kebabActions?: { key: string; text: string; onClick: () => void }[];
  submitId?: string;
}

interface HeaderWrapperProps {
  defaultHeaderState: HeaderOptions | null;
}

const HeaderWrapper = ({ defaultHeaderState }: HeaderWrapperProps) => {
  const currentState = useContext(LayoutStateContext);
  const { change } = useContext(LayoutDispatchContext);

  const currentHeader = useMemo(() => ({ ...currentState.header }), [currentState]);

  useEffect(() => {
    if (!defaultHeaderState) return;
    change({
      meta: {},
      header: {
        utils: [],
        title: "",
        titleTag: "h1",
        isTransparent: false,
        kebabActions: [],
        submitId: "",
        ...defaultHeaderState,
      },
      navBar: {},
    });
  }, [defaultHeaderState]);

  return <HeaderContainer {...defaultHeaderState} {...currentHeader} />;
};

export default HeaderWrapper;
