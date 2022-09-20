import type { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @libs
import { getKey } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useInfiniteDataConverter from "@libs/client/useInfiniteDataConverter";
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
  const { type: userType, mutate: mutateUser } = useUser();

  // fetch data
  const { data, setSize, mutate } = useSWRInfinite<GetChatsResponse>((...arg: [index: number, previousPageData: GetChatsResponse]) => {
    const options = { url: userType === "member" ? "/api/chats" : "" };
    return getKey<GetChatsResponse>(...arg, options);
  });

  // variable: visible
  const { infiniteRef, isReachingEnd, isLoading, collection } = useInfiniteDataConverter<GetChatsResponse>({ data, setSize });

  // reload: infinite list
  useEffect(() => {
    (async () => {
      if (userType === "guest") await mutateUser();
      if (!collection?.singleValue?.success && userType === "member") await mutate();
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
      {collection?.multiValues?.chats && Boolean(collection?.multiValues?.chats?.length) && (
        <div className="-mx-5">
          <ChatList list={collection?.multiValues?.chats} isVisibleSingleUser={false} cardProps={{ isVisibleProduct: true, isVisibleLastChatMessage: true }} className="border-b" />
          <span className="empty:hidden list-loading">{isReachingEnd ? "채팅을 모두 확인하였어요" : isLoading ? "채팅을 불러오고있어요" : null}</span>
        </div>
      )}

      {/* 채팅: Empty */}
      {collection?.multiValues?.chats && !Boolean(collection?.multiValues?.chats?.length) && (
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
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getChats: { options: { url: string; query: string }; response: GetChatsResponse };
}> = ({ getUser, getChats }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
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
  const chats = ssrUser?.profile?.id
    ? await getChats({
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
        options: {
          url: "/api/user",
          query: "",
        },
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getChats: {
        options: {
          url: ssrUser.profile ? "/api/chats" : "",
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(chats || {})),
        },
      },
    },
  };
});

export default Page;
