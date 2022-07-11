import React, { useContext, useEffect, useMemo } from "react";
// @components
import { CommonDispatchContext, CommonStateContext } from "@components/commons/commonContext";
import ModalContainer from "@components/commons/modals/modalContainer";

const ModalWrapper = () => {
  const currentState = useContext(CommonStateContext);
  const { open, close } = useContext(CommonDispatchContext);

  const currentModal = useMemo(() => currentState.get("Modal"), [currentState]);

  useEffect(() => {
    if (currentModal?.length) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  }, [currentModal]);

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
