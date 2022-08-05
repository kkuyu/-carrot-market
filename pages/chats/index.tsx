import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @libs
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/users/my";
import { GetChatsResponse } from "@api/chats";
// @components
import CustomHead from "@components/custom/head";
import ChatList from "@components/lists/chatList";
import Buttons from "@components/buttons";

const getKey = (pageIndex: number, previousPageData: GetChatsResponse) => {
  if (pageIndex === 0) return `/api/chats?page=1`;
  if (previousPageData && !previousPageData.chats.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/chats?page=${pageIndex + 1}`;
};

const ChatHome: NextPage = () => {
  const router = useRouter();
  const { user, currentAddr } = useUser();
  const { changeLayout } = useLayouts();

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });
  const { data, size, setSize, mutate } = useSWRInfinite<GetChatsResponse>(getKey);

  const isReachingEnd = data && size >= data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const chats = data ? data.flatMap((item) => item.chats) : [];

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    changeLayout({
      header: {
        title: "채팅",
        titleTag: "h1",
        utils: ["title"],
      },
      navBar: {
        utils: ["home", "chat", "profile", "story", "streams"],
      },
    });
  }, []);

  if (user?.id === -1) {
    return (
      <div className="container">
        <CustomHead title="채팅" />

        <div className="py-10 text-center">
          <p className="text-notice inline-block">
            이웃과의 채팅은
            <Buttons text="회원가입" sort="text-link" status="default" className="align-top" onClick={() => router.push(`/join?addrNm=${currentAddr?.emdAddrNm}`)} />후 이용 가능합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <CustomHead title="채팅" />

      {/* 채팅: List */}
      {Boolean(chats.length) && (
        <div className="-mx-5">
          <ChatList type="link" list={chats} content="message" isVisibleOnlyOneUser={false} />
          <div ref={infiniteRef} />
          <div className="py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isReachingEnd ? "채팅을 모두 확인하였어요" : isLoading ? "채팅을 불러오고있어요" : ""}</span>
          </div>
        </div>
      )}

      {/* 채팅: Empty */}
      {!Boolean(chats.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">채팅한 이웃이 없어요.</p>
        </div>
      )}
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
