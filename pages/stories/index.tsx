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
import useModal from "@libs/client/useModal";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/users/my";
import { GetStoriesResponse } from "@api/stories";
import { FeelingKeys } from "@api/stories/types";
import { PostStoriesCuriosityResponse } from "@api/stories/[id]/curiosity";
import { PostStoriesEmotionResponse } from "@api/stories/[id]/emotion";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import PictureList, { PictureListItem } from "@components/groups/pictureList";
import FloatingButtons from "@components/floatingButtons";
import Story from "@components/cards/story";
import FeedbackStory, { FeedbackStoryItem } from "@components/groups/feedbackStory";

const getKey = (pageIndex: number, previousPageData: GetStoriesResponse, query: string = "") => {
  if (pageIndex === 0) return `/api/stories?page=1&${query}`;
  if (previousPageData && !previousPageData.stories.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/stories?page=${pageIndex + 1}&${query}`;
};

const StoryHome: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();
  const { openModal } = useModal();

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });
  const { data, size, setSize, mutate } = useSWRInfinite<GetStoriesResponse>((...arg: [index: number, previousPageData: GetStoriesResponse]) =>
    getKey(arg[0], arg[1], currentAddr.emdPosNm ? `posX=${currentAddr.emdPosX}&posY=${currentAddr.emdPosY}&distance=${currentAddr.emdPosDx}` : "")
  );

  const isReachingEnd = data && size >= data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const stories = data ? data.flatMap((item) => item.stories) : [];

  const curiosityItem = async (item: FeedbackStoryItem) => {
    if (!data) return;
    const mutateData = data.map((dataRow) => {
      const stories = dataRow.stories.map((story) => {
        if (story.id !== item.id) return story;
        return {
          ...story,
          curiosity: !story.curiosity,
          curiosities: {
            ...story.curiosities,
            count: story.curiosity ? story.curiosities.count - 1 : story.curiosities.count + 1,
          },
        };
      });
      return { ...dataRow, stories };
    });
    mutate(mutateData, false);
    const updateCuriosity: PostStoriesCuriosityResponse = await (await fetch(`/api/stories/${item.id}/curiosity`, { method: "POST" })).json();
    if (updateCuriosity.error) console.error(updateCuriosity.error);
    mutate();
  };

  const emotionItem = async (item: FeedbackStoryItem, feeling: FeelingKeys) => {
    if (!data) return;
    const mutateData = data.map((dataRow) => {
      const stories = dataRow.stories.map((story) => {
        if (story.id !== item.id) return story;
        const actionType = !story.emotion ? "create" : story.emotion !== feeling ? "update" : "delete";
        return {
          ...story,
          emotion: (() => {
            if (actionType === "create") return feeling;
            if (actionType === "update") return feeling;
            return null;
          })(),
          emotions: {
            ...story.emotions,
            count: (() => {
              if (actionType === "create") return story.emotions.count + 1;
              if (actionType === "update") return story.emotions.count;
              return story.emotions.count - 1;
            })(),
            feelings: (() => {
              if (story.emotions.count === 1) {
                if (actionType === "create") return [feeling];
                if (actionType === "update") return [feeling];
                return [];
              }
              if (actionType === "create") return story.emotions.feelings.includes(feeling) ? story.emotions.feelings : [...story.emotions.feelings, feeling];
              if (actionType === "update") return story.emotions.feelings.includes(feeling) ? story.emotions.feelings : [...story.emotions.feelings, feeling];
              return story.emotions.feelings;
            })(),
          },
        };
      });
      return { ...dataRow, stories };
    });
    mutate(mutateData, false);
    const updateEmotion: PostStoriesEmotionResponse = await (await fetch(`/api/stories/${item.id}/emotion?feeling=${feeling}`, { method: "POST" })).json();
    if (updateEmotion.error) console.error(updateEmotion.error);
    mutate();
  };

  const commentItem = (item: FeedbackStoryItem) => {
    router.push(`/stories/${item?.id}`);
  };

  // modal: sign up
  const openSignUpModal = () => {
    openModal<MessageModalProps>(MessageModal, "signUpNow", {
      type: "confirm",
      message: "휴대폰 인증하고 회원가입하시겠어요?",
      cancelBtn: "취소",
      confirmBtn: "회원가입",
      hasBackdrop: true,
      onConfirm: () => {
        router.push(`/join?addrNm=${currentAddr?.emdAddrNm}`);
      },
    });
  };

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
          <ul className="divide-y-8">
            {stories.map((item) => {
              const shortContent = !item?.content ? "" : item.content.length <= 15 ? item.content : item.content.substring(0, 15) + "...";
              const thumbnails: PictureListItem[] = !item?.photos
                ? []
                : item.photos.split(",").map((src, index, array) => ({
                    src,
                    index,
                    key: `thumbnails-list-${index + 1}`,
                    label: `${index + 1}/${array.length}`,
                    name: `게시글 이미지 ${index + 1}/${array.length} (${shortContent})`,
                  }));

              return (
                <li key={item?.id}>
                  <Link href={`/stories/${item?.id}`}>
                    <a className="block pt-5 pb-4 px-5">
                      <Story item={item} />
                    </a>
                  </Link>
                  {Boolean(thumbnails.length) && (
                    <div className="pb-5 px-5">
                      <PictureList list={thumbnails || []} />
                    </div>
                  )}
                  <FeedbackStory
                    item={item}
                    curiosityItem={user?.id === -1 ? openSignUpModal : curiosityItem}
                    emotionItem={user?.id === -1 ? openSignUpModal : emotionItem}
                    commentItem={commentItem}
                  />
                </li>
              );
            })}
          </ul>
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
            _count: {
              select: {
                curiosities: true,
                emotions: true,
                comments: true,
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
