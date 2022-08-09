import { useRouter } from "next/router";
import React, { FocusEvent, useState } from "react";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import { getStoryCategory } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
// @api
import { GetStoriesResponse } from "@api/stories";
import { EmotionIcon, EmotionKeys } from "@api/stories/types";
import { GetStoriesDetailResponse } from "@api/stories/[id]";
import { PostStoriesLikeResponse } from "@api/stories/[id]/like";
// @components
import WelcomeModal, { WelcomeModalProps, WelcomeModalName } from "@components/commons/modals/case/welcomeModal";
import RegisterModal, { RegisterModalProps, RegisterModalName } from "@components/commons/modals/case/registerModal";

export type FeedbackStoryItem = GetStoriesResponse["stories"][0] | GetStoriesDetailResponse["story"];

export interface FeedbackStoryProps {
  item?: FeedbackStoryItem;
}

const FeedbackStory = ({ item }: FeedbackStoryProps) => {
  const router = useRouter();
  const { user, type: userType } = useUser();
  const { openModal } = useModal();

  const { data, mutate: boundMutate } = useSWR<GetStoriesDetailResponse>(item?.id ? `/api/stories/${item.id}` : null);
  const [updateLike, { loading: likeLoading }] = useMutation<PostStoriesLikeResponse>(item?.id ? `/api/stories/${item.id}/like` : "", {
    onSuccess: () => {
      boundMutate();
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const [isVisibleBox, setIsVisibleBox] = useState(false);
  const category = getStoryCategory(item?.category || "");
  const likeRecord = data?.story?.records?.find((record) => record.userId === user?.id && record.kind === Kind.StoryLike);
  const likeRecords = data?.story?.records?.filter((record) => record.kind === Kind.StoryLike) || [];
  const commentCount = data?.story?.comments?.length || item?.comments?.length;

  // like
  const clickLike = () => {
    if (userType === "member") toggleLike();
    if (userType === "non-member") openModal<RegisterModalProps>(RegisterModal, RegisterModalName, {});
    if (userType === "guest") openModal<WelcomeModalProps>(WelcomeModal, WelcomeModalName, {});
  };
  const toggleLike = (emotion: null | EmotionKeys = null) => {
    if (!data) return;
    if (likeLoading) return;
    const isLike = !Boolean(likeRecord);
    boundMutate((prev) => {
      let records = prev?.story?.records ? [...prev.story.records] : [];
      const idx = records.findIndex((record) => record.id === likeRecord?.id);
      if (!emotion && !isLike) records.splice(idx, 1);
      if (emotion && !isLike) records[idx].emotion !== emotion ? records.splice(idx, 1, { ...records[idx], emotion }) : records.splice(idx, 1);
      if (isLike) records.push({ id: 0, kind: Kind.StoryLike, emotion, userId: user?.id! });
      return prev && { ...prev, story: { ...prev.story, records: records } };
    }, false);
    updateLike({ emotion });
  };

  // emotion
  const clickEmotionButton = () => setIsVisibleBox((prev) => !prev);
  const blurEmotionButton = (e: FocusEvent<HTMLButtonElement, Element>) => {
    const boxEl = e.relatedTarget?.closest(".emotionBox");
    if (boxEl?.isSameNode(e.relatedTarget)) return;
    if (boxEl?.contains(e.relatedTarget)) return;
    setIsVisibleBox(false);
  };
  const clickEmotionIcon = (key: EmotionKeys) => {
    if (userType === "member") toggleLike(key);
    if (userType === "non-member") openModal<RegisterModalProps>(RegisterModal, RegisterModalName, {});
    if (userType === "guest") openModal<WelcomeModalProps>(WelcomeModal, WelcomeModalName, {});
    setIsVisibleBox(false);
  };
  const blurEmotionBox = (e: FocusEvent<HTMLDivElement, Element>) => {
    const boxEl = e.target.closest(".emotionBox");
    const prevEl = boxEl?.previousElementSibling as HTMLElement;
    if (boxEl?.isSameNode(e.relatedTarget)) return;
    if (boxEl?.contains(e.relatedTarget)) return;
    prevEl?.focus();
    setIsVisibleBox(false);
  };

  // comment
  const clickComment = () => {
    if (router.pathname === "/stories/[id]") {
      (document.querySelector(".container input#content") as HTMLInputElement)?.focus();
    } else {
      router.push(`/stories/${item?.id}`);
    }
  };

  if (!item) return null;

  return (
    <div className="relative px-5 border-t">
      {/* 궁금해요: button */}
      {!category?.isLikeWithEmotion && (
        <button type="button" onClick={clickLike} className="py-2">
          <svg className={`inline-block w-5 h-5 ${likeRecord ? "text-orange-500" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className={`ml-1 text-sm ${likeRecord ? "text-orange-500" : "text-gray-500"}`}>궁금해요 {likeRecords.length || null}</span>
        </button>
      )}
      {/* 공감하기: button */}
      {category?.isLikeWithEmotion && (
        <button type="button" onClick={clickEmotionButton} onBlur={blurEmotionButton} className="py-2">
          {!likeRecord ? (
            <svg className="inline-block w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <span className="inline-block w-5 h-5">{EmotionIcon?.[likeRecord.emotion!].text}</span>
          )}
          {!likeRecord ? <span className="ml-1 text-sm text-gray-500">공감하기</span> : <span className="ml-1 text-sm text-orange-500">공감했어요</span>}
        </button>
      )}
      {/* 공감하기: box */}
      {category?.isLikeWithEmotion && (
        <div onBlur={blurEmotionBox} className={`absolute bottom-12 left-5 scale-0 origin-bottom-left transition-all ${isVisibleBox ? "visible scale-100" : "invisible"} emotionBox`} tabIndex={0}>
          <div className="px-2 bg-white border border-gray-300 rounded-lg">
            {Object.entries(EmotionIcon)
              .sort(([, a], [, b]) => a.index - b.index)
              .map(([key, emotion]) => (
                <button key={key} type="button" onClick={() => clickEmotionIcon(key as EmotionKeys)} className="p-1">
                  {emotion.text}
                </button>
              ))}
          </div>
        </div>
      )}
      {/* 공감하기: result */}
      {category?.isLikeWithEmotion && Boolean(likeRecords.length) && (
        <div className="absolute bottom-0 right-0 flex items-center h-10 pr-5">
          <span className="text-sm">
            {Object.entries(EmotionIcon)
              .sort(([, a], [, b]) => a.index - b.index)
              .filter(([key]) => likeRecords.find((i) => i.emotion === key))
              .map(([key, emotion]) => (
                <span key={key}>{emotion.text}</span>
              ))}
          </span>
          <span className="ml-1 block text-sm text-gray-500">{likeRecords.length}</span>
        </div>
      )}
      {/* 댓글/답변 */}
      <button type="button" className="ml-4 py-2" onClick={clickComment}>
        <svg className="inline-block w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          ></path>
        </svg>
        <span className="ml-1 text-sm text-gray-500">{commentCount ? `${category?.commentType} ${commentCount}` : `${category?.commentType}쓰기`}</span>
      </button>
    </div>
  );
};

export default React.memo(FeedbackStory, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
