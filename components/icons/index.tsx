import type { SVGAttributes } from "react";
// @components
import * as icons from "@components/icons/data/index";
import { IconName } from "@components/icons/data/types";

interface IconsProps extends SVGAttributes<SVGElement> {
  name: keyof typeof IconName;
}

const Icons = (props: IconsProps) => {
  const { name, ...restProps } = props;
  const DynamicIcon = icons[name];
  return <DynamicIcon {...restProps} />;
};

export default Icons;
