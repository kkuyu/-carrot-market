import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
// @libs
import useLayouts from "@libs/client/useLayouts";
// @pages
import type { NextPageWithLayout } from "@pages/_app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";

const Error500: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();

  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(() => {
      if (/^\/products\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
      if (/^\/stories\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
      if (/^\/comments\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
      if (/^\/profiles\/\w*$/.test(router.asPath)) return "프로필을 불러올 수 없습니다.";
      return "500";
    });
  }, [router.asPath]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container">
      <h1>Error: {message}</h1>
    </div>
  );
};

const Page: NextPageWithLayout = () => {
  return <Error500 />;
};

Page.getLayout = getLayout;

export const getStaticProps: GetStaticProps = async () => {
  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "ERROR 500",
    },
    header: {
      title: "",
      titleTag: "strong",
      utils: ["back", "title", "home"],
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
