import type { NextPage } from "next";
import { useEffect, useRef } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @libs
import { getKey } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetUserResponse } from "@api/user";
import { GetStoriesResponse } from "@api/stories";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import StoryList from "@components/lists/storyList";
import FloatingButtons from "@components/floatingButtons";
import FeedbackStory from "@components/groups/feedbackStory";

const StoriesIndexPage: NextPage = () => {
  const { user, currentAddr } = useUser();
  const { changeLayout } = useLayouts();

  const { data, setSize, mutate } = useSWRInfinite<GetStoriesResponse>((...arg: [index: number, previousPageData: GetStoriesResponse]) => {
    const options = { url: "/api/stories", query: currentAddr.emdPosNm ? `posX=${currentAddr.emdPosX}&posY=${currentAddr.emdPosY}&distance=${currentAddr.emdPosDx}` : "" };
    return getKey<GetStoriesResponse>(...arg, options);
  });

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-44px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const stories = data ? data.flatMap((item) => item.stories) : null;

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize((size) => size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    if (!data?.[0].success && currentAddr.emdPosNm) mutate();
  }, [data, currentAddr]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container">
      <h1 className="sr-only">동네생활</h1>

      {/* 동네생활: List */}
      {stories && Boolean(stories.length) && (
        <div className="-mx-5">
          <StoryList list={stories}>
            <FeedbackStory key="FeedbackStory" />
          </StoryList>
          <div ref={infiniteRef} />
          {isReachingEnd ? (
            <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">게시글을 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">게시글을 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 동네생활: Empty */}
      {stories && !Boolean(stories.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">
            앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
            <br />
            등록된 게시글이 없어요.
          </p>
        </div>
      )}

      {/* 글쓰기 */}
      <FloatingButtons href="/stories/upload">
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </FloatingButtons>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getStories: { options: { url: string; query?: string }; response: GetStoriesResponse };
}> = ({ getUser, getStories }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetStoriesResponse]) => getKey<GetStoriesResponse>(...arg, getStories.options))]: [getStories.response],
        },
      }}
    >
      <StoriesIndexPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // getStories
  const posX = ssrUser?.currentAddr?.emdPosX;
  const posY = ssrUser?.currentAddr?.emdPosY;
  const distance = ssrUser?.currentAddr?.emdPosDx;
  const stories =
    !posX || !posY || !distance
      ? []
      : await client.story.findMany({
          take: 10,
          skip: 0,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            records: {
              where: {
                kind: Kind.StoryLike,
              },
              select: {
                id: true,
                kind: true,
                emotion: true,
                userId: true,
              },
            },
            comments: {
              where: {
                AND: { depth: { gte: StoryCommentMinimumDepth, lte: StoryCommentMaximumDepth } },
                NOT: [{ content: "" }],
              },
              select: {
                id: true,
              },
            },
          },
          where: {
            emdPosX: { gte: posX - distance, lte: posX + distance },
            emdPosY: { gte: posY - distance, lte: posY + distance },
          },
        });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "동네생활",
    },
    header: {
      title: "",
      titleTag: "strong",
      utils: ["address", "search"],
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
      getStories: {
        options: {
          url: "/api/stories",
          query: `posX=${posX}&posY=${posY}&distance=${distance}`,
        },
        response: {
          success: true,
          stories: JSON.parse(JSON.stringify(stories || [])),
          pages: 0,
        },
      },
    },
  };
});

export default Page;
