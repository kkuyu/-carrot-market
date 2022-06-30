import { useContext } from "react";

import { CommonDispatchContext } from "@components/commons/commonContext";
import { ToastStructure } from "@components/commons";

const useToast = () => {
  const { open, close } = useContext(CommonDispatchContext);

  const openToast = <T>(Component: ToastStructure["Component"], name: ToastStructure["name"], props: ToastStructure["props"] & T) => {
    open("Toast", Component, name, props);
  };

  const closeToast = (Component: ToastStructure["Component"], name: ToastStructure["name"]) => {
    close("Toast", Component, name);
  };

  return {
    openToast,
    closeToast,
  };
};

export default useToast;
