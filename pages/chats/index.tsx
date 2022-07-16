import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSetRecoilState } from "recoil";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/users/my";
import { GetChatsResponse } from "@api/chats";
// @components
import Chat from "@components/cards/chat";
import Buttons from "@components/buttons";

const getKey = (pageIndex: number, previousPageData: GetChatsResponse) => {
  if (pageIndex === 0) return `/api/chats?page=1`;
  if (previousPageData && !previousPageData.chats.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/chats?page=${pageIndex + 1}`;
};

const ChatHome: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });
  const { data, size, setSize, mutate } = useSWRInfinite<GetChatsResponse>(getKey);

  const isReachingEnd = data && size === data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const chats = data ? data.flatMap((item) => item.chats) : [];

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    setLayout(() => ({
      title: "채팅",
      header: {
        headerUtils: ["title"],
      },
      navBar: {
        navBarUtils: ["home", "chat", "profile", "story", "streams"],
      },
    }));
  }, []);

  if (user?.id === -1) {
    return (
      <div className="container">
        <div className="py-10 text-center">
          <div className="relative inline-block pl-6">
            <svg className="absolute top-0.5 left-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-left">
              이웃과의 채팅은
              <Buttons text="회원가입" sort="text-link" status="default" className="align-top" onClick={() => router.push(`/join?addrNm=${currentAddr?.emdAddrNm}`)} />후 이용 가능합니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* 채팅: List */}
      {Boolean(chats.length) && (
        <div className="-mx-5">
          <ul className="divide-y">
            {chats
              .filter((item) => item.chatMessages.length)
              .map((item) => {
                const users = item.users.filter((chatUser) => chatUser.id !== user?.id);
                const usersThumbnail = users.length === 1 ? users[0].avatar || "" : "";
                const productThumbnail = item.product?.photos.length ? item.product?.photos.split(",")[0] : "";
                return (
                  <li key={item.id}>
                    <Link href={`/chats/${item.id}`}>
                      <a className="block px-5 py-3">
                        <Chat item={item} users={users} usersThumbnail={usersThumbnail} productThumbnail={productThumbnail} />
                      </a>
                    </Link>
                  </li>
                );
              })}
          </ul>
          <div className="py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isLoading ? "채팅을 불러오고있어요" : isReachingEnd ? "채팅을 모두 확인하였어요" : ""}</span>
          </div>
        </div>
      )}

      {/* 채팅: Empty */}
      {!Boolean(chats.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">채팅한 이웃이 없어요.</p>
        </div>
      )}

      {/* infiniteRef */}
      <div ref={infiniteRef} />
    </div>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getChats: { response: GetChatsResponse };
}> = ({ getUser, getChats }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [unstable_serialize(getKey)]: [getChats.response],
        },
      }}
    >
      <ChatHome />
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

  const chats = ssrUser.profile
    ? await client.chat.findMany({
        take: 10,
        skip: 0,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
            },
          },
          chatMessages: {
            take: 1,
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
        where: {
          users: {
            some: {
              id: ssrUser.profile?.id,
            },
          },
        },
      })
    : [];

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
      getChats: {
        response: {
          success: true,
          chats: JSON.parse(JSON.stringify(chats || [])),
          pages: 0,
        },
      },
    },
  };
});

export default Page;
