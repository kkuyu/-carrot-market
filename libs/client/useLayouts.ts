import { useContext } from "react";
// @components
import { LayoutState } from "@components/layouts";
import { LayoutDispatchContext } from "@components/layouts/layoutContext";

const useLayouts = () => {
  const { change } = useContext(LayoutDispatchContext);

  const changeLayout = (state: LayoutState) => {
    change(state);
  };

  return {
    changeLayout,
  };
};

export default useLayouts;
