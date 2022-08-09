import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
// @libs
import useMutation from "@libs/client/useMutation";
import useToast from "@libs/client/useToast";
// @api
import { PostLogoutResponse } from "@api/user/logout";
// @pages
import type { NextPageWithLayout } from "@pages/_app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";

const UserLogout: NextPage = () => {
  const router = useRouter();
  const { openToast } = useToast();

  const [logoutUser, { loading: logoutUserLoading }] = useMutation<PostLogoutResponse>("/api/user/logout", {
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
  return <UserLogout />;
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
