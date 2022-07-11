import { useContext } from "react";
// @components
import { CommonDispatchContext } from "@components/commons/commonContext";
import { PanelStructure } from "@components/commons";

const usePanel = () => {
  const { open, close } = useContext(CommonDispatchContext);

  const openPanel = <T>(Component: PanelStructure["Component"], name: PanelStructure["name"], props: PanelStructure["props"] & T) => {
    open("Panel", Component, name, props);
  };

  const closePanel = (Component: PanelStructure["Component"], name: PanelStructure["name"]) => {
    close("Panel", Component, name);
  };

  return {
    openPanel,
    closePanel,
  };
};

export default usePanel;
