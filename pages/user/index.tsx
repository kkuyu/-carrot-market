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
// @api
import { GetUserResponse } from "@api/user";
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
  const { changeLayout } = useLayouts();
  const { openModal } = useModal();

  const MenuItem = (props: { pathname?: string | null; onClick?: () => void | null } & HTMLAttributes<HTMLButtonElement | HTMLLinkElement>) => {
    const { pathname, onClick, className: itemClassName = "", children, ...itemRestProps } = props;
    const classNames = {
      wrapper: "block py-0.5 w-full px-5",
      inner: "flex items-center space-x-2",
    };
    if (!pathname) {
      return (
        <Buttons tag="button" type="button" sort="text-link" status="unset" onClick={onClick} className={`${classNames.wrapper} ${itemClassName}`} {...itemRestProps}>
          <div className={classNames.inner}>{children}</div>
        </Buttons>
      );
    }
    return (
      <Link href={pathname} passHref>
        <Buttons tag="a" sort="text-link" status="unset" className={`${classNames.wrapper} ${itemClassName}`} {...itemRestProps}>
          <div className={classNames.inner}>{children}</div>
        </Buttons>
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
          children: (
            <MenuItem pathname={`/profiles/${user?.id}/products/all`}>
              <Icons name="ShoppingCart" className="w-5 h-5" />
              <span>판매내역</span>
            </MenuItem>
          ),
        },
        {
          key: "purchases",
          isVisible: userType === "member",
          children: (
            <MenuItem pathname={`/user/purchases`}>
              <Icons name="ShoppingBag" className="w-5 h-5" />
              <span>구매내역</span>
            </MenuItem>
          ),
        },
        {
          key: "likes",
          isVisible: userType === "member",
          children: (
            <MenuItem pathname={`/user/likes`}>
              <Icons name="Heart" className="w-5 h-5" />
              <span>관심목록</span>
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
          children: (
            <MenuItem pathname={`/profiles/${user?.id}/stories/story`}>
              <Icons name="Newspaper" className="w-5 h-5" />
              <span>동네생활 글/댓글</span>
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
          children: (
            <MenuItem pathname={`/account`}>
              <Icons name="Cog8Tooth" className="w-5 h-5" />
              <span>계정 관리</span>
            </MenuItem>
          ),
        },
        {
          key: "edit",
          isVisible: true,
          children: (
            <MenuItem pathname={`/user/edit`}>
              <Icons name="PencilSquare" className="w-5 h-5" />
              <span>프로필 수정</span>
            </MenuItem>
          ),
        },
        {
          key: "hometown",
          isVisible: true,
          children: (
            <MenuItem
              onClick={() => {
                openModal<HometownUpdateModalProps>(HometownUpdateModal, HometownUpdateModalName, {});
              }}
            >
              <Icons name="MapPin" className="w-5 h-5" />
              <span>내 동네 설정</span>
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
      {/* 프로필 */}
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

      {/* 메뉴 */}
      <div className="space-y-2">
        {userMenu.map((item) => {
          if (!item.links.find((v) => v.isVisible)) return null;
          return (
            <div key={item.key} className="-mx-5 pt-4 border-t">
              <h2 className="px-5">{item.name}</h2>
              <ul className="mt-1.5">
                {item.links.map((link) => {
                  if (!link.isVisible) return null;
                  return <li key={link.key}>{link.children}</li>;
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
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
      getUser: {
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
    },
  };
});

export default Page;
