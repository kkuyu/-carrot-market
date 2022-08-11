import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
// @libs
import useMutation from "@libs/client/useMutation";
import useToast from "@libs/client/useToast";
// @api
import { PostAccountLogoutResponse } from "@api/account/logout";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";

const AccountLogoutPage: NextPage = () => {
  const router = useRouter();
  const { openToast } = useToast();

  const [logoutUser, { data: logoutUserData, loading: logoutUserLoading }] = useMutation<PostAccountLogoutResponse>("/api/account/logout", {
    onSuccess: () => {},
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          break;
      }
    },
  });

  useEffect(() => {
    if (logoutUserData?.isExisted) {
      openToast<MessageToastProps>(MessageToast, "LogoutUser", {
        placement: "bottom",
        message: "로그아웃되었습니다",
      });
    }
    router.replace("/welcome");
  }, [logoutUserData]);

  useEffect(() => {
    if (logoutUserLoading) return;
    logoutUser({});
  }, []);

  return null;
};

const Page: NextPageWithLayout = () => {
  return <AccountLogoutPage />;
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
