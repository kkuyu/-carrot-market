import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { SWRConfig } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useModal from "@libs/client/useModal";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
// @pages
import type { NextPageWithLayout } from "@pages/_app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import Buttons from "@components/buttons";

const UserAccount: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();
  const { openModal } = useModal();

  const openLogoutModal = () => {
    openModal<MessageModalProps>(MessageModal, "logout", {
      type: "confirm",
      message: "정말 로그아웃하시겠어요?",
      cancelBtn: "취소",
      confirmBtn: "로그아웃",
      hasBackdrop: true,
      onConfirm: () => {
        router.push("/user/logout");
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
      <h2 className="">계정 정보</h2>
      <ul className="mt-2 space-y-2">
        <li className="relative">
          <strong className="font-normal">휴대폰 번호</strong>
          <span className="mt-1 block overflow-hidden whitespace-nowrap overflow-ellipsis text-sm text-gray-500 empty:hidden">{user?.phone}</span>
          <Link href="/user/account/phone" passHref>
            <Buttons tag="a" sort="text-link" status="primary" text={user?.phone ? "변경" : "추가"} className="absolute top-0 right-0" />
          </Link>
        </li>
        {user?.id && user?.id !== -1 && (
          <li className="relative">
            <strong className="font-normal">이메일</strong>
            <span className="mt-1 block overflow-hidden whitespace-nowrap overflow-ellipsis text-sm text-gray-500 empty:hidden">{user?.email}</span>
            <Link href="/user/account/email" passHref>
              <Buttons tag="a" sort="text-link" status="primary" text={user?.email ? "변경" : "추가"} className="absolute top-0 right-0" />
            </Link>
          </li>
        )}
      </ul>

      <h2 className="mt-5 pt-5 border-t">기타</h2>
      <ul className="mt-2 space-y-2">
        <li>
          <Buttons tag="button" sort="text-link" status="default" text="로그아웃" onClick={openLogoutModal} className="px-0 no-underline" />
        </li>
        {user?.id && user?.id !== -1 && (
          <li>
            <Link href="/user/account/delete" passHref>
              <Buttons tag="a" sort="text-link" status="default" text="탈퇴하기" className="px-0 no-underline" />
            </Link>
          </li>
        )}
      </ul>
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
      <UserAccount />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // redirect: welcome
  if (!ssrUser.profile && !ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/welcome`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "계정 관리 | 나의 당근",
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
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(ssrUser.profile || {})),
          dummyProfile: JSON.parse(JSON.stringify(ssrUser.dummyProfile || {})),
          currentAddr: JSON.parse(JSON.stringify(ssrUser.currentAddr || {})),
        },
      },
    },
  };
});

export default Page;
