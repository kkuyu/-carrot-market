import { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";

const ErrorPage: NextPageWithLayout<{ statusCode?: number }> = ({ statusCode }) => {
  const router = useRouter();

  const message = useMemo(() => {
    switch (statusCode) {
      case 500:
        if (/^\/products\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
        if (/^\/stories\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
        if (/^\/comments\/\w*$/.test(router.asPath)) return "게시글을 불러올 수 없습니다.";
        if (/^\/profiles\/\w*$/.test(router.asPath)) return "프로필을 불러올 수 없습니다.";
        return "500";
      case 404:
      default:
        if (/^\/products\/\w*$/.test(router.asPath)) return "게시글이 삭제되었거나 존재하지 않습니다.";
        if (/^\/stories\/\w*$/.test(router.asPath)) return "게시글이 삭제되었거나 존재하지 않습니다.";
        if (/^\/comments\/\w*$/.test(router.asPath)) return "게시글이 삭제되었거나 존재하지 않습니다.";
        if (/^\/profiles\/\w*$/.test(router.asPath)) return "탈퇴하였거나 존재하지 않습니다.";
        return "404";
    }
  }, [router.asPath, statusCode]);

  return (
    <section className="container">
      <h1>Error: {message}</h1>
    </section>
  );
};

ErrorPage.getLayout = getLayout;

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;

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
    defaultLayout,
    statusCode,
  };
};

export default ErrorPage;
