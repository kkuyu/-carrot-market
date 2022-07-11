import Link from "next/link";
import Image from "next/image";

export interface ProfilesProps {
  user: {
    id: number;
    name: string;
    avatar?: string | null;
  };
  uuid?: string;
  emdPosNm?: string;
  diffTime?: string;
  size?: "sm" | "base";
}

const Profiles = ({ user, uuid, emdPosNm, diffTime, size = "base" }: ProfilesProps) => {
  const classNames = {
    sm: {
      wrapper: "",
      avatar: "w-11 h-11",
      avatarSvg: "my-3 w-5",
      name: "text-sm",
      extra: "text-xs",
    },
    base: {
      wrapper: "py-3",
      avatar: "w-14 h-14",
      avatarSvg: "my-4 w-6",
      name: "text-base",
      extra: "text-sm",
    },
  };

  return (
    <div className={`flex items-center w-full ${classNames[size].wrapper}`}>
      <div className={`relative flex-none bg-slate-300 border border-gray-300 overflow-hidden rounded-full ${classNames[size].avatar}`}>
        {user?.avatar ? (
          <>
            <span className="block pb-[100%]"></span>
            <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${user?.avatar}/avatar`} alt="" layout="fill" objectFit="cover" />
          </>
        ) : (
          <svg className={`mx-auto text-slate-500 ${classNames[size].avatarSvg}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            ></path>
          </svg>
        )}
      </div>
      <div className="grow pl-3">
        <strong className={`block font-semibold ${classNames[size].name}`}>{user?.name}</strong>
        <span className={`block text-gray-500 ${classNames[size].extra}`}>{[emdPosNm, diffTime, uuid].filter((v) => !!v).join(" · ")}</span>
      </div>
      {/* <div>todo: 매너온도</div> */}
    </div>
  );
};

export default Profiles;
