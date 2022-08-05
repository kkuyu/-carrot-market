import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
// @libs
import useLayouts from "@libs/client/useLayouts";
// @components
import CustomHead from "@components/custom/head";

const Error500: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();

  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(() => {
      if (/^\/products\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
      if (/^\/stories\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
      if (/^\/comments\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
      if (/^\/users\/profiles\/\w*$/.test(router.asPath)) return "프로필을 불러올 수 없습니다.";
      return "500";
    });
  }, [router.asPath]);

  useEffect(() => {
    changeLayout({
      header: {
        title: "",
        titleTag: "strong",
        utils: ["back", "title", "home"],
      },
      navBar: {
        utils: [],
      },
    });
  }, []);

  return (
    <div className="container">
      <CustomHead title="500" />
      <h1>Error: {message}</h1>
    </div>
  );
};

export default Error500;
