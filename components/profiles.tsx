import type { HTMLAttributes } from "react";
// @components
import Images from "@components/images";

export interface ProfilesProps extends HTMLAttributes<HTMLDivElement> {
  user: {
    id: number;
    name: string;
    avatar?: string | null;
  };
  signature?: string;
  uuid?: string;
  emdPosNm?: string;
  diffTime?: string;
  size?: "tiny" | "sm" | "base";
}

const Profiles = (props: ProfilesProps) => {
  const { user, signature, uuid, emdPosNm, diffTime, size = "base", className = "", ...restProps } = props;

  const classNames = {
    tiny: {
      imageGap: "mr-2",
      imageSize: "2.25rem",
      userName: "text-sm",
      userInfo: "text-xs",
    },
    sm: {
      imageGap: "mr-3",
      imageSize: "2.75rem",
      userName: "text-sm",
      userInfo: "text-xs",
    },
    base: {
      imageGap: "mr-3",
      imageSize: "3.5rem",
      userName: "text-base",
      userInfo: "text-sm",
    },
  };

  return (
    <div className={`flex items-center w-full ${className}`} {...restProps}>
      <div className={`flex-none ${classNames[size].imageGap}`}>
        <Images size={classNames[size].imageSize} cloudId={user?.avatar} alt="" />
      </div>
      <div className="grow shrink basis-auto min-w-0">
        <strong className={`block font-semibold text-sm overflow-hidden whitespace-nowrap overflow-ellipsis ${classNames[size].userName}`}>{user?.name}</strong>
        <span className={`block text-gray-500 overflow-hidden whitespace-nowrap overflow-ellipsis ${classNames[size].userInfo}`}>
          {[signature, emdPosNm, diffTime, uuid].filter((v) => !!v).join(" · ")}
        </span>
        {/* <div>todo: 매너온도</div> */}
      </div>
    </div>
  );
};

export default Profiles;
