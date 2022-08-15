import React, { useContext, useEffect, useMemo } from "react";
// @components
import { PanelDefaultProps } from "@components/commons";
import { CommonDispatchContext, CommonStateContext } from "@components/commons/commonContext";
import PanelContainer from "@components/commons/panels/panelContainer";

const PanelWrapper = () => {
  const currentState = useContext(CommonStateContext);
  const { open, close } = useContext(CommonDispatchContext);

  const currentPanel = useMemo(() => {
    return currentState.get("Panel")?.map((panel) => ({
      ...panel,
      props: {
        ...panel.props,
        scrim: panel?.props?.scrim || PanelDefaultProps.scrim,
      },
    }));
  }, [currentState]);

  useEffect(() => {
    if (currentPanel?.length) {
      if (!currentPanel.find((panel) => panel.props.scrim === "modal")) return;
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
