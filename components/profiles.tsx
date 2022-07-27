// @components
import Images from "@components/images";

export interface ProfilesProps {
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

const Profiles = ({ user, signature, uuid, emdPosNm, diffTime, size = "base" }: ProfilesProps) => {
  if (size === "tiny") {
    return (
      <div className="flex items-center w-full">
        <Images size="2.25rem" cloudId={user?.avatar} alt="" />
        <div className="grow shrink basis-auto min-w-0 pl-2">
          <strong className="block font-semibold overflow-hidden whitespace-nowrap overflow-ellipsis text-sm">{user?.name}</strong>
          <span className="block text-gray-500 text-xs">{[signature, emdPosNm, diffTime, uuid].filter((v) => !!v).join(" · ")}</span>
          {/* <div>todo: 매너온도</div> */}
        </div>
      </div>
    );
  }

  if (size === "sm") {
    return (
      <div className="flex items-center w-full">
        <Images size="2.75rem" cloudId={user?.avatar} alt="" />
        <div className="grow shrink basis-auto min-w-0 pl-3">
          <strong className="block font-semibold overflow-hidden whitespace-nowrap overflow-ellipsis text-sm">{user?.name}</strong>
          <span className="block text-gray-500 text-xs">{[signature, emdPosNm, diffTime, uuid].filter((v) => !!v).join(" · ")}</span>
          {/* <div>todo: 매너온도</div> */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center w-full">
      <Images cloudId={user?.avatar} alt="" />
      <div className="grow shrink basis-auto min-w-0 pl-3">
        <strong className="block font-semibold overflow-hidden whitespace-nowrap overflow-ellipsis text-base">{user?.name}</strong>
        <span className="block text-gray-500 text-sm">{[signature, emdPosNm, diffTime, uuid].filter((v) => !!v).join(" · ")}</span>
        {/* <div>todo: 매너온도</div> */}
      </div>
    </div>
  );
};

export default Profiles;
