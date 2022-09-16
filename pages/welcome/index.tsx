import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Icons from "@components/icons";
import Buttons from "@components/buttons";

const WelcomeIndexPage: NextPage = () => {
  return (
    <section className="container flex flex-col items-center h-min-full-screen pt-5 pb-5">
      <div className="grow-full inline-flex flex-col justify-center text-center">
        <Icons name="PuzzlePiece" className="mx-auto w-16 h-16" />
        <h1 className="mt-4 text-xl">당근 근처의 당근마켓</h1>
        <h2 className="mt-2 font-normal">
          중고 거래부터 동네 정보까지, 이웃과 함께해요.
          <br />
          가깝고 따뜻한 당신의 근처를 만들어보세요.
        </h2>
      </div>
      <div className="mt-4 flex-none w-full text-center">
        <Link href="/welcome/locate" passHref>
          <Buttons tag="a" sort="round-box">
            시작하기
          </Buttons>
        </Link>
        <div className="mt-4">
          <span className="text-gray-500">이미 계정이 있나요?</span>
          <Link href="/account/login" passHref>
            <Buttons tag="a" sort="text-link">
              로그인
            </Buttons>
          </Link>
        </div>
      </div>
    </section>
  );
};

const Page: NextPageWithLayout = () => {
  return <WelcomeIndexPage />;
};

Page.getLayout = getLayout;

export const getStaticProps: GetStaticProps = async () => {
  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "",
    },
    header: {
      title: "",
      titleTag: "strong",
      utils: [],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
    },
  };
};

export default Page;
