import type { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @libs
import { getKey } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetChatsResponse, getChats } from "@api/chats";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ChatList from "@components/lists/chatList";
import Buttons from "@components/buttons";

const ChatsIndexPage: NextPage = () => {
  const { type: userType } = useUser();

  // fetch data
  const { data, setSize, mutate } = useSWRInfinite<GetChatsResponse>((...arg: [index: number, previousPageData: GetChatsResponse]) => {
    const options = { url: userType === "member" ? "/api/chats" : "" };
    return getKey<GetChatsResponse>(...arg, options);
  });

  // variable: invisible
  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "0px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const chats = data ? data.flatMap((item) => item.chats) : null;

  // update: infinite list
  useEffect(() => {
    if (isVisible && !isReachingEnd) setSize((size) => size + 1);
  }, [isVisible, isReachingEnd]);

  // reload: infinite list
  useEffect(() => {
    (async () => {
      if (!data?.[0].success && userType === "member") await mutate();
    })();
  }, [data, userType]);

  if (userType !== "member") {
    return (
      <div className="container">
        <p className="list-empty">
          이웃과의 채팅은
          <br />
          <Link href="/account/phone" passHref>
            <Buttons tag="a" sort="text-link" status="default" className="align-top">
              휴대폰 인증
            </Buttons>
          </Link>
          후 이용 가능합니다
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* 채팅: List */}
      {chats && Boolean(chats.length) && (
        <div className="-mx-5">
          <ChatList list={chats} isVisibleSingleUser={false} cardProps={{ isVisibleProduct: true, isVisibleLastChatMessage: true }} className="border-b" />
          <span className="empty:hidden list-loading">{isReachingEnd ? "채팅을 모두 확인하였어요" : isLoading ? "채팅을 불러오고있어요" : null}</span>
        </div>
      )}

      {/* 채팅: Empty */}
      {chats && !Boolean(chats.length) && (
        <p className="list-empty">
          <>채팅한 이웃이 없어요</>
        </p>
      )}

      {/* 채팅: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getChats: { options: { url: string; query?: string }; response: GetChatsResponse };
}> = ({ getUser, getChats }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetChatsResponse]) => getKey<GetChatsResponse>(...arg, getChats.options))]: [getChats.response],
        },
      }}
    >
      <ChatsIndexPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // getChats
  const { totalCount, chats } = ssrUser?.profile?.id
    ? await getChats({
        pageSize: 10,
        prevCursor: 0,
        userId: ssrUser?.profile?.id,
      })
    : {
        totalCount: 0,
        chats: [],
      };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "채팅",
    },
    header: {
      title: "채팅",
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
      getChats: {
        options: {
          url: ssrUser.profile ? "/api/chats" : "",
        },
        response: {
          success: true,
          totalCount: JSON.parse(JSON.stringify(totalCount || 0)),
          chats: JSON.parse(JSON.stringify(chats || [])),
        },
      },
    },
  };
});

export default Page;
