import type { NextPage } from "next";
import Link from "next/link";
import type { HTMLAttributes } from "react";
import { useEffect } from "react";
import { SWRConfig } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useModal from "@libs/client/useModal";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import HometownUpdateModal, { HometownUpdateModalProps, HometownUpdateModalName } from "@components/commons/modals/instance/hometownUpdateModal";
import Profiles from "@components/profiles";

const UserIndexPage: NextPage = () => {
  const { user, currentAddr, type: userType } = useUser();
  const { changeLayout } = useLayouts();
  const { openModal } = useModal();

  const MenuItem = (props: { pathname?: string | null; onClick?: () => void | null; children: JSX.Element } & HTMLAttributes<HTMLButtonElement | HTMLLinkElement>) => {
    const { pathname, onClick, children } = props;
    const classNames = {
      wrapper: "block w-full text-left",
      inner: "relative block py-1 pl-12 pr-5 [&>svg]:absolute [&>svg]:top-1.5 [&>svg]:left-5 [&>svg]:w-5 [&>svg]:h-5",
    };
    if (!pathname) {
      return (
        <button type="button" onClick={onClick} className={classNames.wrapper}>
          <div className={classNames.inner}>{children}</div>
        </button>
      );
    }
    return (
      <Link href={pathname} passHref>
        <a className={classNames.wrapper}>
          <div className={classNames.inner}>{children}</div>
        </a>
      </Link>
    );
  };

  const userMenu = [
    {
      key: "product",
      name: "나의 판매내역",
      links: [
        {
          key: "products",
          isVisible: userType === "member",
          content: (
            <MenuItem pathname={`/profiles/${user?.id}/products/all`}>
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
                <span>판매내역</span>
              </>
            </MenuItem>
          ),
        },
        {
          key: "purchases",
          isVisible: userType === "member",
          content: (
            <MenuItem pathname={`/user/purchases`}>
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>구매내역</span>
              </>
            </MenuItem>
          ),
        },
        {
          key: "likes",
          isVisible: userType === "member",
          content: (
            <MenuItem pathname={`/user/likes`}>
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>관심목록</span>
              </>
            </MenuItem>
          ),
        },
      ],
    },
    {
      key: "story",
      name: "나의 동네생활",
      links: [
        {
          key: "stories",
          isVisible: userType === "member",
          content: (
            <MenuItem pathname={`/profiles/${user?.id}/stories/story`}>
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
                <span>동네생활 글/댓글</span>
              </>
            </MenuItem>
          ),
        },
      ],
    },
    {
      key: "default",
      name: "사용자 설정",
      links: [
        {
          key: "account",
          isVisible: true,
          content: (
            <MenuItem pathname={`/account`}>
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>계정 관리</span>
              </>
            </MenuItem>
          ),
        },
        {
          key: "edit",
          isVisible: true,
          content: (
            <MenuItem pathname={`/user/edit`}>
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>프로필 수정</span>
              </>
            </MenuItem>
          ),
        },
        {
          key: "hometown",
          isVisible: true,
          content: (
            <MenuItem
              onClick={() => {
                openModal<HometownUpdateModalProps>(HometownUpdateModal, HometownUpdateModalName, {});
              }}
            >
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>내 동네 설정</span>
              </>
            </MenuItem>
          ),
        },
      ],
    },
  ];

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  if (!user) return null;

  return (
    <section className="container pb-5">
      <div className="-mx-5">
        {userType === "member" ? (
          <Link href={`/profiles/${user?.id}`}>
            <a className="block-arrow py-3">
              <Profiles user={user} uuid={`#${user?.id}`} emdPosNm={currentAddr?.emdPosNm || ""} />
            </a>
          </Link>
        ) : (
          <div className="relative block px-5 py-3">
            <Profiles user={user} emdPosNm={currentAddr?.emdPosNm || ""} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {userMenu.map((item) => {
          if (!item.links.find((v) => v.isVisible)) return null;
          return (
            <div key={item.key} className="-mx-5 pt-4 border-t">
              <h2 className="px-5">{item.name}</h2>
              <ul className="mt-2">
                {item.links.map((link) => {
                  if (!link.isVisible) return null;
                  return <li key={link.key}>{link.content}</li>;
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const Page: NextPageWithLayout = () => {
  return (
    <SWRConfig
      value={{
        fallback: {},
      }}
    >
      <UserIndexPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

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
    },
  };
});

export default Page;
