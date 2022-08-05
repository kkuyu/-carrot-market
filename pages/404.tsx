import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
// @libs
import useLayouts from "@libs/client/useLayouts";
// @components
import CustomHead from "@components/custom/head";

const Error404: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();

  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage(() => {
      if (/^\/products\/\w*$/.test(router.asPath)) return "게시글이 삭제되었거나 존재하지 않습니다.";
      if (/^\/stories\/\w*$/.test(router.asPath)) return "게시글이 삭제되었거나 존재하지 않습니다.";
      if (/^\/comments\/\w*$/.test(router.asPath)) return "게시글이 삭제되었거나 존재하지 않습니다.";
      if (/^\/users\/profiles\/\w*$/.test(router.asPath)) return "탈퇴하였거나 존재하지 않습니다.";
      return "404";
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
      <CustomHead title="404" />
      <h1>Error: {message}</h1>
    </div>
  );
};

export default Error404;
