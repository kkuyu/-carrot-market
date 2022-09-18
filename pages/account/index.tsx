import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { SWRConfig } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { PostAccountLogoutResponse } from "@api/account/logout";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import AlertModal, { AlertStyleEnum, AlertModalProps } from "@components/commons/modals/case/alertModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import Buttons from "@components/buttons";

const AccountIndexPage: NextPage = () => {
  const router = useRouter();
  const { user, type: userType } = useUser();
  const { openModal } = useModal();
  const { openToast } = useToast();

  // mutation data
  const [logoutUser, { loading: loadingUser }] = useMutation<PostAccountLogoutResponse>("/api/account/logout", {
    onSuccess: async (data) => {
      if (data?.isExisted) {
        openToast<MessageToastProps>(MessageToast, "LogoutUser", {
          placement: "bottom",
          message: "로그아웃되었습니다",
        });
      }
      await router.push("/welcome");
    },
  });

  // modal: ConfirmLogoutUser
  const openLogoutModal = () => {
    openModal<AlertModalProps>(AlertModal, "ConfirmLogoutUser", {
      message: "정말 로그아웃하시겠어요?",
      actions: [
        {
          key: "cancel",
          style: AlertStyleEnum["cancel"],
          text: "취소",
          handler: null,
        },
        {
          key: "destructive",
          style: AlertStyleEnum["destructive"],
          text: "로그아웃",
          handler: () => {
            if (loadingUser) return;
            logoutUser({});
          },
        },
      ],
    });
  };

  return (
    <div className="container pt-5 pb-5 space-y-8">
      <div>
        <h2 className="">계정 정보</h2>
        <ul className="mt-2 space-y-2">
          <li className="flex items-start gap-2">
            <div className="grow-full">
              <strong className="block font-normal">휴대폰 번호</strong>
              <span className="empty:hidden block pb-0.5 text-sm text-gray-500 text-ellipsis">{user?.phone}</span>
            </div>
            <Link href="/account/phone" passHref>
              <Buttons tag="a" sort="text-link" status="primary" className="flex-none pl-0 pr-0">
                {user?.phone ? "변경" : "등록 및 회원가입"}
              </Buttons>
            </Link>
          </li>
          {userType === "member" && (
            <li className="flex items-start">
              <div className="grow-full">
                <strong className="block font-normal">이메일</strong>
                <span className="empty:hidden block pb-0.5 text-sm text-gray-500 text-ellipsis">{user?.email}</span>
              </div>
              <Link href="/account/email" passHref>
                <Buttons tag="a" sort="text-link" status="primary" className="flex-none pl-0 pr-0">
                  {user?.email ? "변경" : "등록"}
                </Buttons>
              </Link>
            </li>
          )}
        </ul>
      </div>

      <div>
        <h2 className="">기타</h2>
        <ul className="mt-2 space-y-2">
          <li>
            <Buttons tag="button" sort="text-link" status="unset" onClick={openLogoutModal}>
              로그아웃
            </Buttons>
          </li>
          {/* todo: 탈퇴하기 */}
          {userType === "member" && (
            <li>
              <Link href="/account/delete" passHref>
                <Buttons tag="a" sort="text-link" status="unset">
                  탈퇴하기
                </Buttons>
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

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

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
