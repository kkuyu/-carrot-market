import { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
// @libs
import { PageLayout } from "@libs/states";
// @components
import Buttons from "@components/buttons";

const WelcomeHome: NextPage = () => {
  const setLayout = useSetRecoilState(PageLayout);

  useEffect(() => {
    setLayout(() => ({
      title: "",
      header: {
        headerUtils: [],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <section className="container">
      <div className="flex flex-col items-center w-full h-min-full-screen text-center">
        <div className="grow flex flex-col justify-center">
          <svg className="mx-auto w-16 h-16" role="img" aria-hidden fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            ></path>
          </svg>
          <h1 className="mt-4 text-xl">당근 근처의 당근마켓</h1>
          <h2 className="mt-2 font-normal">
            중고 거래부터 동네 정보까지,
            <br />
            지금 내 동네를 서낵하고 시작해보세요!
          </h2>
        </div>

        <div className="flex-none w-full pb-6">
          <Link href="/welcome/locate" passHref>
            <Buttons tag="a" sort="round-box" text="시작하기" />
          </Link>
          <div className="mt-4">
            <span className="text-gray-500">이미 계정이 있나요?</span>
            <Link href="/login" passHref>
              <Buttons tag="a" sort="text-link" text="로그인" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeHome;
