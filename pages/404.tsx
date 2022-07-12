import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
// @libs
import { PageLayout } from "@libs/states";

const Error404: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const [message, setMessage] = useState("");

  const makeMessage = () => {
    if (/^\/products\/[0-9]*$/.test(router.asPath)) {
      return "게시글이 삭제되었거나 존재하지 않습니다.";
    }
    if (/^\/stories\/[0-9]*$/.test(router.asPath)) {
      return "게시글이 삭제되었거나 존재하지 않습니다.";
    }
    if (/^\/users\/profiles\/[0-9]*$/.test(router.asPath)) {
      return "탈퇴하였거나 존재하지 않습니다.";
    }
    return "404";
  };

  useEffect(() => {
    const currentMessage = makeMessage();

    setMessage(currentMessage);

    setLayout(() => ({
      title: currentMessage,
      header: {
        headerUtils: ["back", "home"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div>
      <h1>Error: {message}</h1>
    </div>
  );
};

export default Error404;