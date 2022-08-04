import type { NextPage } from "next";
import { useEffect, useRef } from "react";
import { useSetRecoilState } from "recoil";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetUserResponse } from "@api/users/my";
import { GetStoriesResponse } from "@api/stories";
// @components
import StoryList from "@components/lists/storyList";
import FloatingButtons from "@components/floatingButtons";
import FeedbackStory from "@components/groups/feedbackStory";

const getKey = (pageIndex: number, previousPageData: GetStoriesResponse, query: string = "") => {
  if (pageIndex === 0) return `/api/stories?page=1&${query}`;
  if (previousPageData && !previousPageData.stories.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/stories?page=${pageIndex + 1}&${query}`;
};

const StoryHome: NextPage = () => {
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });
  const { data, size, setSize } = useSWRInfinite<GetStoriesResponse>((...arg: [index: number, previousPageData: GetStoriesResponse]) =>
    getKey(arg[0], arg[1], currentAddr.emdPosNm ? `posX=${currentAddr.emdPosX}&posY=${currentAddr.emdPosY}&distance=${currentAddr.emdPosDx}` : "")
  );

  const isReachingEnd = data && size >= data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const stories = data ? data.flatMap((item) => item.stories) : [];

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    setLayout(() => ({
      seoTitle: "동네생활",
      header: {
        headerUtils: ["address", "search"],
      },
      navBar: {
        navBarUtils: ["home", "chat", "profile", "story", "streams"],
      },
    }));
  }, []);

  return (
    <div className="container">
      {/* 동네생활: List */}
      {Boolean(stories.length) && (
        <div className="-mx-5">
          <StoryList list={stories}>
            <FeedbackStory key="FeedbackStory" />
          </StoryList>
          <div className="py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isLoading ? "게시글을 불러오고있어요" : isReachingEnd ? "게시글을 모두 확인하였어요" : ""}</span>
          </div>
        </div>
      )}

      {/* 동네생활: Empty */}
      {!Boolean(stories.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">
            앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
            <br />
            등록된 게시글이 없어요.
          </p>
        </div>
      )}

      {/* infiniteRef */}
      <div ref={infiniteRef} />

      {/* 글쓰기 */}
      <FloatingButtons href="/stories/upload">
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </FloatingButtons>
    </div>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getStories: { query: string; response: GetStoriesResponse };
}> = ({ getUser, getStories }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetStoriesResponse]) => getKey(arg[0], arg[1], getStories.query))]: [getStories.response],
        },
      }}
    >
      <StoryHome />
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
                depth: {
                  gte: StoryCommentMinimumDepth,
                  lte: StoryCommentMaximumDepth,
                },
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
      getStories: {
        query: `posX=${posX}&posY=${posY}&distance=${distance}`,
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
