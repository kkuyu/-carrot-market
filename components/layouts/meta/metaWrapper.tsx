import React, { useContext, useEffect, useMemo } from "react";
// @components
import { LayoutDispatchContext, LayoutStateContext } from "@components/layouts/layoutContext";
import MetaContainer from "@components/layouts/meta/metaContainer";

export interface MetaOptions {
  title?: string;
  description?: string;
}

interface MetaWrapperProps {
  defaultMetaState: MetaOptions | null;
}

const MetaWrapper = ({ defaultMetaState }: MetaWrapperProps) => {
  const currentState = useContext(LayoutStateContext);
  const { change } = useContext(LayoutDispatchContext);

  const currentMeta = useMemo(() => ({ ...currentState.meta }), [currentState]);

  useEffect(() => {
    if (!defaultMetaState) return;
    change({
      meta: {
        title: "",
        description: "",
        ...defaultMetaState,
      },
      header: {},
      navBar: {},
    });
  }, [defaultMetaState]);

  return <MetaContainer {...defaultMetaState} {...currentMeta} />;
};

export default MetaWrapper;
