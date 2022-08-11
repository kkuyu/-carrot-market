import React, { useContext, useMemo } from "react";
// @components
import { CommonDispatchContext, CommonStateContext } from "@components/commons/commonContext";
import ToastContainer from "@components/commons/toasts/toastContainer";

const ToastWrapper = () => {
  const currentState = useContext(CommonStateContext);
  const { open, close } = useContext(CommonDispatchContext);

  const currentToast = useMemo(() => currentState.get("Toast"), [currentState]);

  if (!currentToast?.length) return null;

  return (
    <ToastContainer>
      {currentToast?.map(({ Type, Component, name, props }) => {
        const onOpen = () => open(Type, Component, name, props);
        const onClose = () => close(Type, Component, name);

        return <Component key={name} {...props} {...{ name, onOpen, onClose }} />;
      })}
    </ToastContainer>
  );
};

export default ToastWrapper;
