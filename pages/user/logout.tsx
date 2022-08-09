import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
// @libs
import useMutation from "@libs/client/useMutation";
import useToast from "@libs/client/useToast";
// @api
import { PostUserLogoutResponse } from "@api/user/logout";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";

const UserLogoutPage: NextPage = () => {
  const router = useRouter();
  const { openToast } = useToast();

  const [logoutUser, { loading: logoutUserLoading }] = useMutation<PostUserLogoutResponse>("/api/user/logout", {
    onSuccess: (data) => {
      if (data.isExisted) {
        openToast<MessageToastProps>(MessageToast, `logout`, {
          placement: "bottom",
          message: "로그아웃되었습니다",
        });
      }
      router.push("/welcome");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          break;
      }
    },
  });

  useEffect(() => {
    if (logoutUserLoading) return;
    logoutUser({});
  }, []);

  return null;
};

const Page: NextPageWithLayout = () => {
  return <UserLogoutPage />;
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
