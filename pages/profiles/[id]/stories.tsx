import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { getKey } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetProfilesDetailResponse } from "@api/profiles/[id]";
import { GetProfilesStoriesResponse } from "@api/profiles/[id]/stories";
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import StoryList from "@components/lists/storyList";
import CommentSummaryList from "@components/lists/commentSummaryList";

type StoryTab = {
  index: number;
  value: "stories" | "stories/comments";
  text: string;
  name: string;
};

const ProfilesStoriesPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const storyTabs: StoryTab[] = [
    { value: "stories", index: 0, text: "게시글", name: "등록된 게시글" },
    { value: "stories/comments", index: 1, text: "댓글", name: "등록된 댓글" },
  ];
  const [currentTab, setCurrentTab] = useState<StoryTab>(() => {
    return storyTabs.find((tab) => tab.value === router?.query?.filter) || storyTabs.find((tab) => tab.index === 0) || storyTabs[0];
  });

  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/profiles/${router.query.id}` : null);
  const { data, setSize } = useSWRInfinite<GetProfilesStoriesResponse>((...arg: [index: number, previousPageData: GetProfilesStoriesResponse]) => {
    const options = { url: router.query.id ? `/api/profiles/${router.query.id}/${currentTab.value}` : "" };
    return getKey<GetProfilesStoriesResponse>(...arg, options);
  });

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "20px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const results = data
    ? {
        stories: data.flatMap((item) => item.stories),
        comments: data.flatMap((item) => item.comments),
      }
    : null;

  const changeFilter = (tab: StoryTab) => {
    setCurrentTab(tab);
    window.scrollTo(0, 0);
    const route = { pathname: router.pathname, query: { ...router.query, filter: tab.value } };
    router.replace(route, undefined, { shallow: true });
  };

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize((size) => size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  if (!profileData?.profile) return null;

  return (
    <div className="container">
      <div className="sticky top-12 left-0 -mx-5 flex bg-white border-b z-[1]">
        {storyTabs.map((tab) => {
          return (
            <button
              key={tab.index}
              type="button"
              className={`basis-full py-2 text-sm font-semibold ${tab.value === currentTab.value ? "text-black" : "text-gray-500"}`}
              onClick={() => changeFilter(tab)}
            >
              {tab.text}
            </button>
          );
        })}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform"
          style={{ width: `${100 / storyTabs.length}%`, transform: `translateX(${100 * currentTab.index}%)` }}
        />
      </div>

      {/* 게시글: List */}
      {results && (Boolean(results.stories.length) || Boolean(results.comments.length)) && (
        <div className="-mx-5">
          {/* 게시글 */}
          {Boolean(results.stories.length) && <h2 className="sr-only">게시글</h2>}
          {Boolean(results.stories.length) && <StoryList list={results.stories} className="border-b" />}
          {/* 댓글 */}
          {Boolean(results.comments.length) && <h2 className="sr-only">댓글</h2>}
          {Boolean(results.comments.length) && <CommentSummaryList list={results.comments} className="border-b" />}
          {/* infinite */}
          <div id="infiniteRef" ref={infiniteRef} />
          {isReachingEnd ? (
            <span className="block px-5 py-6 text-center text-sm text-gray-500">{currentTab?.name}을 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="block px-5 py-6 text-center text-sm text-gray-500">{currentTab?.name}을 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 게시글: Empty */}
      {results && !(Boolean(results.stories.length) || Boolean(results.comments.length)) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`${currentTab?.name}이 존재하지 않아요`}</p>
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProfile: { response: GetProfilesDetailResponse };
  getStories: { options: { url: string; query?: string }; response: GetProfilesStoriesResponse };
  getComments: { options: { url: string; query?: string }; response: GetProfilesStoriesResponse };
}> = ({ getUser, getProfile, getStories, getComments }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/profiles/${getProfile.response.profile.id}`]: getProfile.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesStoriesResponse]) => getKey<GetProfilesStoriesResponse>(...arg, getStories.options))]: [getStories.response],
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesStoriesResponse]) => getKey<GetProfilesStoriesResponse>(...arg, getComments.options))]: [getComments.response],
        },
      }}
    >
      <ProfilesStoriesPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // profileId
  const profileId: string = params?.id?.toString() || "";

  // invalidUrl
  let invalidUrl = false;
  if (!profileId || isNaN(+profileId)) invalidUrl = true;
  // redirect `/profiles/${profileId}`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}`,
      },
    };
  }

  // getProfile
  const profile = await client.user.findUnique({
    where: {
      id: +profileId,
    },
  });

  // invalidProfile
  let invalidProfile = false;
  if (!profile) invalidProfile = true;
  // redirect `/profiles/${profileId}`
  if (invalidProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}`,
      },
    };
  }

  // getStories
  const stories = await client.story.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      userId: profile?.id,
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
  });

  // getComments
  const comments = await client.storyComment.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      userId: profile?.id,
      NOT: [{ content: "" }],
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
          kind: Kind.CommentLike,
        },
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      story: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `동네생활 | ${profile?.name} | 프로필`,
    },
    header: {
      title: `${profile?.name}님의 동네생활`,
      titleTag: "h1",
      utils: ["back", "title"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getUser: {
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(profile || {})),
        },
      },
      getStories: {
        options: {
          url: `/api/profiles/${profile?.id}/stories`,
        },
        response: {
          success: true,
          stories: JSON.parse(JSON.stringify(stories || [])),
          comments: [],
          pages: 0,
        },
      },
      getComments: {
        options: {
          url: `/api/profiles/${profile?.id}/stories/comments`,
        },
        response: {
          success: true,
          stories: [],
          comments: JSON.parse(JSON.stringify(comments || [])),
          pages: 0,
        },
      },
    },
  };
});

export default Page;
