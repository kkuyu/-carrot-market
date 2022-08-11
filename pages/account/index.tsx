import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { SWRConfig } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { PostAccountLogoutResponse } from "@api/account/logout";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import Buttons from "@components/buttons";

const AccountIndexPage: NextPage = () => {
  const router = useRouter();
  const { user, type: userType } = useUser();
  const { changeLayout } = useLayouts();
  const { openModal } = useModal();
  const { openToast } = useToast();

  const [logoutUser, { loading: logoutUserLoading }] = useMutation<PostAccountLogoutResponse>("/api/account/logout", {
    onSuccess: (data) => {
      if (data?.isExisted) {
        openToast<MessageToastProps>(MessageToast, "LogoutUser", {
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

  const openLogoutModal = () => {
    openModal<MessageModalProps>(MessageModal, "LogoutUser", {
      type: "confirm",
      message: "정말 로그아웃하시겠어요?",
      cancelBtn: "취소",
      confirmBtn: "로그아웃",
      hasBackdrop: true,
      onConfirm: () => {
        if (logoutUserLoading) return;
        logoutUser({});
      },
    });
  };

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <div>
        <h2 className="">계정 정보</h2>
        <ul className="mt-2 space-y-2">
          <li className="flex">
            <div className="grow shrink basis-auto min-w-0 ">
              <strong className="block font-normal">휴대폰 번호</strong>
              <span className="empty:hidden mt-1 block overflow-hidden whitespace-nowrap overflow-ellipsis text-sm text-gray-500">{user?.phone}</span>
            </div>
            <Link href="/account/phone" passHref>
              <Buttons tag="a" sort="text-link" status="primary" text={user?.phone ? "변경" : "등록 및 회원가입"} className="flex-none pl-2 pr-0" />
            </Link>
          </li>
          {userType === "member" && (
            <li className="flex">
              <div className="grow shrink basis-auto min-w-0 ">
                <strong className="block font-normal">이메일</strong>
                <span className="empty:hidden mt-1 block overflow-hidden whitespace-nowrap overflow-ellipsis text-sm text-gray-500">{user?.email}</span>
              </div>
              <Link href="/account/email" passHref>
                <Buttons tag="a" sort="text-link" status="primary" text={user?.email ? "변경" : "등록"} className="flex-none pl-2 pr-0" />
              </Link>
            </li>
          )}
        </ul>
      </div>

      <div className="mt-5 pt-5 border-t">
        <h2 className="">기타</h2>
        <ul className="mt-2 space-y-2">
          <li>
            <Buttons tag="button" sort="text-link" status="unset" text="로그아웃" onClick={openLogoutModal} />
          </li>
          {userType === "member" && (
            <li>
              <Link href="/account/delete" passHref>
                <Buttons tag="a" sort="text-link" status="unset" text="탈퇴하기" />
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
}> = ({ getUser }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
        },
      }}
    >
      <AccountIndexPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "계정 관리",
    },
    header: {
      title: "계정 관리",
      titleTag: "h1",
      utils: ["back", "title"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getUser: {
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
    },
  };
});

export default Page;
