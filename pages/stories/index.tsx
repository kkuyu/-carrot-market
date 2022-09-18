import type { NextPage } from "next";
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
import { GetStoriesResponse, getStories } from "@api/stories";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import StoryList from "@components/lists/storyList";
import PictureList from "@components/groups/pictureList";
import FloatingButtons from "@components/floatingButtons";
import FeedbackStory from "@components/groups/feedbackStory";

const StoriesIndexPage: NextPage = () => {
  const { currentAddr } = useUser();

  // variable: visible
  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "0px" });

  // fetch data
  const { data, setSize, mutate } = useSWRInfinite<GetStoriesResponse>((...arg: [index: number, previousPageData: GetStoriesResponse]) => {
    const options = { url: "/api/stories", query: currentAddr ? `posX=${currentAddr.emdPosX}&posY=${currentAddr.emdPosY}&distance=${currentAddr.emdPosDx}` : "" };
    return getKey<GetStoriesResponse>(...arg, options);
  });

  // variable: invisible
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const stories = data ? data.flatMap((item) => item.stories) : null;

  // update: infinite list
  useEffect(() => {
    if (isVisible && !isReachingEnd) setSize((size) => size + 1);
  }, [isVisible, isReachingEnd]);

  // reload: infinite list
  useEffect(() => {
    (async () => {
      if (!data?.[0].success && currentAddr.emdPosNm) await mutate();
    })();
  }, [data, currentAddr]);

  return (
    <div className="container">
      <h1 className="sr-only">동네생활</h1>

      {/* 동네생활: List */}
      {stories && Boolean(stories.length) && (
        <>
          <StoryList list={stories} cardProps={{ summaryType: "record" }} className="-mx-5 border-b-2 divide-y-2">
            <PictureList key="PictureList" />
            <FeedbackStory key="FeedbackStory" />
          </StoryList>
          <span className="empty:hidden list-loading">{isReachingEnd ? "게시글을 모두 확인하였어요" : isLoading ? "게시글을 불러오고있어요" : null}</span>
        </>
      )}

      {/* 동네생활: Empty */}
      {stories && !Boolean(stories.length) && (
        <p className="list-empty">
          앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
          <br />
          등록된 게시글이 없어요
        </p>
      )}

      {/* 동네생활: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />

      {/* 글쓰기 */}
      <FloatingButtons aria-label="동네생활 글쓰기" />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getStories: { options: { url: string; query: string }; response: GetStoriesResponse };
}> = ({ getUser, getStories }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
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
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidUser
  // redirect: `/`
  if (!ssrUser?.currentAddr) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // getStories
  const posX = ssrUser?.currentAddr?.emdPosX;
  const posY = ssrUser?.currentAddr?.emdPosY;
  const distance = ssrUser?.currentAddr?.emdPosDx;

  const stories =
    posX && posY && distance
      ? await getStories({
          prevCursor: 0,
          posX,
          posY,
          distance,
        })
      : {
          stories: [],
          totalCount: 0,
        };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "동네생활",
    },
    header: {
      title: "",
      titleTag: "strong",
      utils: ["address", "magnifier"],
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
      getStories: {
        options: {
          url: "/api/stories",
          query: `posX=${posX}&posY=${posY}&distance=${distance}`,
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(stories || {})),
        },
      },
    },
  };
});

export default Page;
