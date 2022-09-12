import type { HTMLAttributes } from "react";
// @components
import Images from "@components/images";

export interface ProfilesProps extends HTMLAttributes<HTMLDivElement> {
  user: {
    id: number;
    name: string;
    photos: string;
  };
  signature?: string;
  uuid?: string;
  emdPosNm?: string;
  diffTime?: string;
  size?: "tiny" | "sm" | "base";
}

const Profiles = (props: ProfilesProps) => {
  const { user, signature, uuid, emdPosNm, diffTime, size = "base", className = "", ...restProps } = props;

  return (
    <div className={`flex items-center w-full ${className}`} {...restProps}>
      <div className={`flex-none ${size === "tiny" || size === "sm" ? "mr-2" : "mr-3"}`}>
        <Images
          size={`${size === "tiny" ? "2.25rem" : size === "sm" ? "2.75rem" : "3.5rem"}`}
          cloudId={user?.photos?.replace(/;.*/, "")}
          text={user?.name?.slice(0, 2)}
          alt=""
          className="rounded-full"
        />
      </div>
      <div className="grow-full">
        <strong className={`block font-semibold text-sm text-ellipsis ${size === "tiny" || size === "sm" ? "text-sm" : "text-base"}`}>{user?.name}</strong>
        <div className={`text-description text-ellipsis ${size === "tiny" ? "text-xs" : "text-sm"}`}>
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
