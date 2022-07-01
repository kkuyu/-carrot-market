import { useRouter } from "next/router";

import useUser from "@libs/client/useUser";

import AddressButton from "@components/layouts/header/utils/addressButton";

const HeaderUtils = {
  Address: "address",
  Back: "back",
  Home: "home",
  Search: "search",
  Title: "title",
} as const;
type HeaderUtils = typeof HeaderUtils[keyof typeof HeaderUtils];

export interface HeaderProps {
  title?: string;
  headerUtils?: HeaderUtils[];
}

const Header = ({ title, headerUtils = [] }: HeaderProps) => {
  const router = useRouter();
  const { user } = useUser();

  const getUtils = (name: HeaderUtils) => {
    switch (name) {
      case "address":
        return (
          <AddressButton
            buttonClick={() => {
              console.log("buttonClick");
            }}
          />
        );
      case "back":
        return (
          <button className="p-3" onClick={() => router.back()}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
        );
      case "home":
        return (
          <button className="p-3" onClick={() => router.push("/")}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              ></path>
            </svg>
          </button>
        );
      case "search":
        // todo: search
        return <span>search</span>;
      case "title":
        return <strong className="text-base font-semibold font-semibold truncate">{`${title ? title : "title"}`}</strong>;
      default:
        return null;
    }
  };

  if (!headerUtils.length) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 w-full z-100">
      <div className="mx-auto w-full max-w-xl bg-white border-b">
        <div className="relative">
          {/* left utils */}
          <div className="absolute top-1/2 left-0 flex -translate-y-1/2">
            {headerUtils.includes(HeaderUtils["Back"]) && <>{getUtils(HeaderUtils["Back"])}</>}
            {headerUtils.includes(HeaderUtils["Address"]) && <>{getUtils(HeaderUtils["Address"])}</>}
          </div>

          {/* center utils */}
          <div className="flex justify-center items-center w-full h-12 px-20">{headerUtils.includes(HeaderUtils["Title"]) && <>{getUtils(HeaderUtils["Title"])}</>}</div>

          {/* right utils */}
          <div className="absolute top-1/2 right-0 flex -translate-y-1/2">
            {headerUtils.includes(HeaderUtils["Home"]) && <>{getUtils(HeaderUtils["Home"])}</>}
            {headerUtils.includes(HeaderUtils["Search"]) && <>{getUtils(HeaderUtils["Search"])}</>}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
