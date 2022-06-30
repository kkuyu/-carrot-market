import { useContext } from "react";

import { CommonDispatchContext } from "@components/commons/commonContext";
import { ModalStructure } from "@components/commons";

const useModal = () => {
  const { open, close } = useContext(CommonDispatchContext);

  const openModal = <T>(Component: ModalStructure["Component"], name: ModalStructure["name"], props: ModalStructure["props"] & T) => {
    open("Modal", Component, name, props);
  };

  const closeModal = (Component: ModalStructure["Component"], name: ModalStructure["name"]) => {
    close("Modal", Component, name);
  };

  return {
    openModal,
    closeModal,
  };
};

export default useModal;
