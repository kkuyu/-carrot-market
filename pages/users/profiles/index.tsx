import { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { SWRConfig } from "swr";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/users/my";
// @components
import Profiles from "@components/profiles";

const ProfileHome: NextPage = () => {
  const { user, currentAddr } = useUser();
  const setLayout = useSetRecoilState(PageLayout);

  useEffect(() => {
    setLayout(() => ({
      title: "나의 당근",
      header: {
        headerUtils: ["title"],
      },
      navBar: {
        navBarUtils: ["home", "chat", "profile", "story", "streams"],
      },
    }));
  }, []);

  if (!user) {
    return null;
  }

  if (user?.id === -1) {
    return (
      <section className="container pb-5">
        <h1 className="sr-only">나의 당근</h1>
        <div className="-mx-5">
          <div className="relative block pl-5 pr-10">
            <Profiles user={user} uuid={user?.id === -1 ? "" : `#${user?.id}`} emdPosNm={currentAddr?.emdPosNm || ""} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="-mx-5 pt-4 border-t">
            <h2 className="px-5">기타</h2>
            <ul className="mt-2">
              <li>
                <Link href="/users/profiles/edit">
                  <a className="relative block py-2 pl-14 pr-5">
                    <svg className="absolute top-1/2 left-5 -mt-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>프로필 수정</span>
                  </a>
                </Link>
              </li>
              <li>
                <Link href="">
                  <a className="relative block py-2 pl-14 pr-5">
                    <svg className="absolute top-1/2 left-5 -mt-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>내 동네 설정</span>
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container pb-5">
      <h1 className="sr-only">나의 당근</h1>

      <div className="-mx-5">
        <Link href={`/users/profiles/${user?.id}`}>
          <a className="block-arrow">
            <Profiles user={user} uuid={user?.id === -1 ? "" : `#${user?.id}`} emdPosNm={currentAddr?.emdPosNm || ""} />
          </a>
        </Link>
      </div>

      <div className="space-y-2">
        <div className="-mx-5 pt-4 border-t">
          <h2 className="px-5">나의 판매내역</h2>
          <ul className="mt-2">
            <li>
              <Link href={`/users/profiles/${user?.id}/products`}>
                <a className="relative block py-2 pl-14 pr-5">
                  <svg className="absolute top-1/2 left-5 -mt-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                  <span>판매내역</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/users/profiles/purchases">
                <a className="relative block py-2 pl-14 pr-5">
                  <svg className="absolute top-1/2 left-5 -mt-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>구매내역</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/users/profiles/favorites">
                <a className="relative block py-2 pl-14 pr-5">
                  <svg className="absolute top-1/2 left-5 -mt-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>관심목록</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>

        <div className="-mx-5 pt-4 border-t">
          <h2 className="px-5">나의 동네생활</h2>
          <ul className="mt-2">
            <li>
              <Link href="">
                <a className="relative block py-2 pl-14 pr-5">
                  <svg className="absolute top-1/2 left-5 -mt-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <span>동네생활 글/댓글</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>

        <div className="-mx-5 pt-4 border-t">
          <h2 className="px-5">기타</h2>
          <ul className="mt-2">
            <li>
              <Link href="/users/profiles/edit">
                <a className="relative block py-2 pl-14 pr-5">
                  <svg className="absolute top-1/2 left-5 -mt-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>프로필 수정</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="">
                <a className="relative block py-2 pl-14 pr-5">
                  <svg className="absolute top-1/2 left-5 -mt-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>내 동네 설정</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
}> = ({ getUser }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
        },
      }}
    >
      <ProfileHome />
    </SWRConfig>
  );
};

export const getServerSideProps = withSsrSession(async ({ req }) => {
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

  return {
    props: {
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
