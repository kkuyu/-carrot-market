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
      userInfo: "text-sm",
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
        <Images size={classNames[size].imageSize} cloudId={user?.avatar} alt="" className="rounded-full" />
      </div>
      <div className="grow-full">
        <strong className={`block font-semibold text-sm text-ellipsis ${classNames[size].userName}`}>{user?.name}</strong>
        <div className={`text-description text-ellipsis ${classNames[size].userInfo}`}>
          {signature && <span>{signature}</span>}
          {emdPosNm && <span>{emdPosNm}</span>}
          {diffTime && <span>{diffTime}</span>}
          {uuid && <span>{uuid}</span>}
        </div>
        {/* <div>todo: 매너온도</div> */}
      </div>
    </div>
  );
};

export default Profiles;
