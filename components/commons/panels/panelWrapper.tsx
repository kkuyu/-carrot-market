import React, { useContext, useEffect, useMemo } from "react";

import { CommonDispatchContext, CommonStateContext } from "@components/commons/commonContext";
import PanelContainer from "@components/commons/panels/panelContainer";

const PanelWrapper = () => {
  const currentState = useContext(CommonStateContext);
  const { open, close } = useContext(CommonDispatchContext);

  const currentPanel = useMemo(() => currentState.get("Panel"), [currentState]);

  useEffect(() => {
    if (currentPanel?.length) {
      document.body.classList.add("panel-open");
    } else {
      document.body.classList.remove("panel-open");
    }
  }, [currentPanel]);

  return (
    <>
      {currentPanel?.map(({ Type, Component, name, props }) => {
        const onOpen = () => open(Type, Component, name, props);
        const onClose = () => close(Type, Component, name);

        return (
          <PanelContainer key={name} onClose={onClose}>
            <Component {...props} {...{ name, onOpen, onClose }} />
          </PanelContainer>
        );
      })}
    </>
  );
};

export default PanelWrapper;
