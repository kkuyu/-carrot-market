import React, { useState, useMemo } from "react";

import { CommonDispatch, CommonState } from "@components/commons";
import { CommonDispatchContext, CommonStateContext } from "@components/commons/commonContext";
import ModalWrapper from "@components/commons/modals/modalWrapper";
import ToastWrapper from "@components/commons/toasts/toastWrapper";

const CommonProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentState, setCurrentState] = useState<CommonState>(
    new Map([
      ["Modal", []],
      ["Toast", []],
    ])
  );

  const open: CommonDispatch["open"] = (Type, Component, name, props) => {
    setCurrentState((stated) => {
      return new Map(
        [...stated].map(([key, structure]) => {
          return key === Type ? [key, [...structure, { Type, Component, name, props }]] : [key, structure];
        })
      );
    });
  };

  const close: CommonDispatch["close"] = (Type, Component, name) => {
    setCurrentState((stated) => {
      return new Map(
        [...stated].map(([key, structure]) => {
          return [key, structure.filter((item) => !(item.Type === Type && item.name === name && item.Component === Component))];
        })
      );
    });
  };

  const dispatch = useMemo(() => ({ open, close }), []);

  return (
    <CommonStateContext.Provider value={currentState}>
      <CommonDispatchContext.Provider value={dispatch}>
        {children}
        <ModalWrapper />
        <ToastWrapper />
      </CommonDispatchContext.Provider>
    </CommonStateContext.Provider>
  );
};

export default CommonProvider;
