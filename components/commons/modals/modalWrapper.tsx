import React, { useContext, useMemo } from "react";

import { CommonDispatchContext, CommonStateContext } from "@components/commons/commonContext";
import ModalContainer from "@components/commons/modals/modalContainer";

const ModalWrapper = () => {
  const currentState = useContext(CommonStateContext);
  const { open, close } = useContext(CommonDispatchContext);

  const currentModal = useMemo(() => currentState.get("Modal"), [currentState]);

  return (
    <>
      {currentModal?.map(({ Type, Component, name, props }) => {
        const onOpen = () => open(Type, Component, name, props);
        const onClose = () => close(Type, Component, name);

        return (
          <ModalContainer key={name} onClose={onClose}>
            <Component {...props} {...{ name, onOpen, onClose }} />
          </ModalContainer>
        );
      })}
    </>
  );
};

export default ModalWrapper;
