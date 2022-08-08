import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
// @libs
import useLayouts from "@libs/client/useLayouts";
// @pages
import type { NextPageWithLayout } from "@pages/_app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";

const Error404: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();

  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(() => {
      if (/^\/products\/\w*$/.test(router.asPath)) return "게시글이 삭제되었거나 존재하지 않습니다.";
      if (/^\/stories\/\w*$/.test(router.asPath)) return "게시글이 삭제되었거나 존재하지 않습니다.";
      if (/^\/comments\/\w*$/.test(router.asPath)) return "게시글이 삭제되었거나 존재하지 않습니다.";
      if (/^\/profiles\/\w*$/.test(router.asPath)) return "탈퇴하였거나 존재하지 않습니다.";
      return "404";
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
  return <Error404 />;
};

Page.getLayout = getLayout;

export const getStaticProps: GetStaticProps = async () => {
  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "ERROR 404",
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
