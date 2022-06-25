import { NextPage } from "next";

import Layout from "@components/layout";
import Button from "@components/button";
import Link from "next/link";

const Welcome: NextPage = () => {
  return (
    <Layout hasHeadBar={false}>
      <section className="container">
        <div className="flex flex-col items-center w-full h-max-fullScreen text-center">
          <div className="grow flex flex-col justify-center">
            <svg className="mx-auto w-16 h-16" role="img" aria-hidden fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
            <h1 className="mt-4 text-xl font-semibold">당근 근처의 당근마켓</h1>
            <h2 className="mt-2">
              중고 거래부터 동네 정보까지,
              <br />
              지금 내 동네를 서낵하고 시작해보세요!
            </h2>
          </div>
          <div className="flex-none w-full pb-6">
            <Button text="시작하기" />
            <div className="mt-4 text-sm">
              <span className="text-gray-500">이미 계정이 있나요?</span>
              <Link href="/enter">
                <a className="ml-1 font-semibold text-orange-500">로그인</a>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Welcome;
