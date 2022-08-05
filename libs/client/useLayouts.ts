import { useContext } from "react";
// @components
import { LayoutState } from "@components/layouts";
import { LayoutDispatchContext } from "@components/layouts/layoutContext";

const useLayouts = () => {
  const { change, reset } = useContext(LayoutDispatchContext);

  const changeLayout = (state: LayoutState) => {
    change(state);
  };

  const resetLayout = () => {
    reset();
  };

  return {
    changeLayout,
    resetLayout,
  };
};

export default useLayouts;
