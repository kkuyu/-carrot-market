import type { NextPage } from "next";
import Link from "next/link";
import NextError from "next/error";
import { SWRConfig } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import HometownUpdateModal, { HometownUpdateModalProps, HometownUpdateModalName } from "@components/commons/modals/instance/hometownUpdateModal";
import Profiles from "@components/profiles";
import Buttons from "@components/buttons";
import Icons from "@components/icons";

const UserIndexPage: NextPage = () => {
  const { user, currentAddr, type: userType } = useUser();
  const { openModal } = useModal();

  if (!user) {
    return <NextError statusCode={500} />;
  }

  return (
    <section className="container pt-3 pb-3">
      {/* 프로필 */}
      <div className="">
        <Profiles user={user} uuid={userType === "member" ? `#${user?.id}` : ""} emdPosNm={currentAddr?.emdPosNm || ""} />
        {userType === "member" && (
          <Link href={`/profiles/${user?.id}`} passHref>
            <Buttons tag="a" size="sm" status="default" className="mt-3">
              프로필 보기
            </Buttons>
          </Link>
        )}
      </div>

      {/* 메뉴 */}
      <div className="mt-5 space-y-5">
        {/* 나의 판매내역 */}
        {userType === "member" && (
          <div>
            <h2>나의 판매내역</h2>
            <ul className="mt-1">
              <li>
                <Link href={`/profiles/${user?.id}/products/all`} passHref>
                  <Buttons tag="a" sort="text-link" status="unset" className="block py-1 w-full">
                    <div className="flex items-center space-x-2">
                      <Icons name="ShoppingCart" className="w-5 h-5" />
                      <span>판매내역</span>
                    </div>
                  </Buttons>
                </Link>
              </li>
              <li>
                <Link href={`/user/products/purchase`} passHref>
                  <Buttons tag="a" sort="text-link" status="unset" className="block py-1 w-full">
                    <div className="flex items-center space-x-2">
                      <Icons name="ShoppingBag" className="w-5 h-5" />
                      <span>구매내역</span>
                    </div>
                  </Buttons>
                </Link>
              </li>
              <li>
                <Link href={`/user/products/like`} passHref>
                  <Buttons tag="a" sort="text-link" status="unset" className="block py-1 w-full">
                    <div className="flex items-center space-x-2">
                      <Icons name="Heart" className="w-5 h-5" />
                      <span>관심목록</span>
                    </div>
                  </Buttons>
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* 나의 동네생활 */}
        {userType === "member" && (
          <div>
            <h2>나의 동네생활</h2>
            <ul className="mt-1">
              <li>
                <Link href={`/profiles/${user?.id}/stories/all`} passHref>
                  <Buttons tag="a" sort="text-link" status="unset" className="block py-1 w-full">
                    <div className="flex items-center space-x-2">
                      <Icons name="Newspaper" className="w-5 h-5" />
                      <span>동네생활 글/댓글</span>
                    </div>
                  </Buttons>
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* 사용자 설정 */}
        {(userType === "member" || userType === "non-member") && (
          <div>
            <h2>사용자 설정</h2>
            <ul className="mt-1">
              <li>
                <Link href={`/account`} passHref>
                  <Buttons tag="a" sort="text-link" status="unset" className="block py-1 w-full">
                    <div className="flex items-center space-x-2">
                      <Icons name="Cog8Tooth" className="w-5 h-5" />
                      <span>계정 관리</span>
                    </div>
                  </Buttons>
                </Link>
              </li>
              <li>
                <Link href={`/user/edit`} passHref>
                  <Buttons tag="a" sort="text-link" status="unset" className="block py-1 w-full">
                    <div className="flex items-center space-x-2">
                      <Icons name="PencilSquare" className="w-5 h-5" />
                      <span>프로필 수정</span>
                    </div>
                  </Buttons>
                </Link>
              </li>
              <li>
                <Buttons
                  tag="button"
                  type="button"
                  sort="text-link"
                  status="unset"
                  onClick={() => {
                    openModal<HometownUpdateModalProps>(HometownUpdateModal, HometownUpdateModalName, {});
                  }}
                  className="block py-1 w-full"
                >
                  <div className="flex items-center space-x-2">
                    <Icons name="MapPin" className="w-5 h-5" />
                    <span>내 동네 설정</span>
                  </div>
                </Buttons>
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
}> = ({ getUser }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
        },
      }}
    >
      <UserIndexPage />
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
      title: "나의 당근",
    },
    header: {
      title: "나의 당근",
      titleTag: "h1",
      utils: ["title"],
    },
    navBar: {
      utils: ["home", "chat", "profile", "story", "streams"],
    },
  };

  return {
    props: {
      defaultLayout,
      getUser: {
        options: {
          url: "/api/user",
          query: "",
        },
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
    },
  };
});

export default Page;
