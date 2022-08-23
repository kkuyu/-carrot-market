import { useRouter } from "next/router";
import Link from "next/link";
import type { HTMLAttributes, ReactElement, MouseEvent, FocusEvent } from "react";
import { useState, useRef, memo } from "react";
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
import WelcomeAlertModal, { WelcomeAlertModalProps, WelcomeAlertModalName } from "@components/commons/modals/instance/welcomeAlertModal";
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
import Icons from "@components/icons";
import Buttons from "@components/buttons";

export type FeedbackStoryItem = GetStoriesResponse["stories"][0] | GetStoriesDetailResponse["story"];

export interface FeedbackStoryProps extends HTMLAttributes<HTMLDivElement> {
  item?: FeedbackStoryItem;
}

const FeedbackStory = (props: FeedbackStoryProps) => {
  const { item, className = "", ...restProps } = props;
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

  const emotionBox = useRef<HTMLDivElement | null>(null);
  const [isVisibleBox, setIsVisibleBox] = useState(false);

  const category = getStoryCategory(item?.category || "");
  const likeRecord = data?.story?.records?.find((record) => record.userId === user?.id && record.kind === Kind.StoryLike);
  const likeRecords = data?.story?.records?.filter((record) => record.kind === Kind.StoryLike) || [];
  const commentCount = data?.story?.comments?.length || item?.comments?.length;

  // like
  const clickLike = () => {
    if (userType === "member") toggleLike();
    if (userType === "non-member") openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {});
    if (userType === "guest") openModal<WelcomeAlertModalProps>(WelcomeAlertModal, WelcomeAlertModalName, {});
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
  const clickEmotionButton = (e: MouseEvent) => {
    setIsVisibleBox((prev) => !prev);
  };
  const blurEmotionButton = (e: FocusEvent<HTMLButtonElement, Element>) => {
    if (emotionBox?.current?.isSameNode(e.relatedTarget)) return;
    if (emotionBox?.current?.contains(e.relatedTarget)) return;
    setIsVisibleBox(false);
  };
  const clickEmotionIcon = (key: EmotionKeys) => {
    if (userType === "member") toggleLike(key);
    if (userType === "non-member") openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {});
    if (userType === "guest") openModal<WelcomeAlertModalProps>(WelcomeAlertModal, WelcomeAlertModalName, {});
    setIsVisibleBox(false);
  };
  const blurEmotionBox = (e: FocusEvent<HTMLDivElement, Element>) => {
    const prevEl = emotionBox?.current?.previousElementSibling as HTMLElement;
    if (emotionBox?.current?.isSameNode(e.relatedTarget)) return;
    if (emotionBox?.current?.contains(e.relatedTarget)) return;
    prevEl?.focus();
    setIsVisibleBox(false);
  };

  // comment
  const clickComment = () => {
    (document.querySelector(".container input#content") as HTMLInputElement)?.focus();
  };

  const FeedbackButton = (buttonProps: { pathname?: string; children: ReactElement | ReactElement[] } & HTMLAttributes<HTMLButtonElement | HTMLAnchorElement>) => {
    const { pathname, onClick, className: buttonClassName = "", children, ...buttonRestProps } = buttonProps;
    if (!pathname) {
      return (
        <Buttons tag="button" type="button" sort="text-link" size="sm" status="unset" onClick={onClick} className={`inline-flex items-center py-2 ${buttonClassName}`} {...buttonRestProps}>
          {children}
        </Buttons>
      );
    }
    return (
      <Link href={pathname} passHref>
        <Buttons tag="a" sort="text-link" size="sm" status="unset" className={`inline-flex items-center py-2 ${buttonClassName}`} {...buttonRestProps}>
          {children}
        </Buttons>
      </Link>
    );
  };

  if (!item) return null;

  return (
    <div className={`relative flex px-5 border-t ${className}`} {...restProps}>
      {/* 궁금해요: button */}
      {!category?.isLikeWithEmotion && (
        <FeedbackButton onClick={clickLike}>
          <Icons name="QuestionMarkCircleSolid" className={`w-5 h-5 ${likeRecord ? "text-orange-500" : "text-gray-500"}`} />
          <span className={`ml-1 ${likeRecord ? "text-orange-500" : "text-gray-500"}`}>궁금해요 {likeRecords.length || null}</span>
        </FeedbackButton>
      )}

      {/* 공감하기: button */}
      {category?.isLikeWithEmotion && (
        <FeedbackButton onClick={clickEmotionButton} onBlur={blurEmotionButton}>
          {!likeRecord ? <Icons name="FaceSmile" className="w-5 h-5 text-gray-500" /> : <span className="w-5 h-5">{EmotionIcon?.[likeRecord.emotion!].text}</span>}
          {!likeRecord ? <span className="ml-1 text-sm text-gray-500">공감하기</span> : <span className="ml-1 text-sm text-orange-500">공감했어요</span>}
        </FeedbackButton>
      )}

      {/* 공감하기: box */}
      {category?.isLikeWithEmotion && (
        <div
          ref={emotionBox}
          onBlur={blurEmotionBox}
          className={`absolute bottom-11 left-5 scale-0 origin-bottom-left transition-all ${isVisibleBox ? "visible scale-100" : "invisible"} emotionBox`}
          tabIndex={0}
        >
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
        <div className="absolute top-1/2 right-0 inline-flex items-center pr-5 -translate-y-1/2">
          <span>
            {Object.entries(EmotionIcon)
              .sort(([, a], [, b]) => a.index - b.index)
              .filter(([key]) => likeRecords.find((i) => i.emotion === key))
              .map(([key, emotion]) => (
                <span key={key} className="w-5 h-5 text-sm">
                  {emotion.text}
                </span>
              ))}
          </span>
          <span className="ml-1 text-sm text-gray-500">{likeRecords.length}</span>
        </div>
      )}

      {/* 댓글/답변 */}
      {router.pathname === "/stories/[id]" ? (
        <FeedbackButton onClick={clickComment} className="last:ml-4">
          <Icons name="ChatBubbleOvalLeftEllipsis" className="w-5 h-5 text-gray-500" />
          <span className="ml-1 text-sm text-gray-500">{commentCount ? `${category?.commentType} ${commentCount}` : `${category?.commentType}쓰기`}</span>
        </FeedbackButton>
      ) : (
        <FeedbackButton pathname={`/stories/${item?.id}`} className="last:ml-4">
          <Icons name="ChatBubbleOvalLeftEllipsis" className="w-5 h-5 text-gray-500" />
          <span className="ml-1 text-sm text-gray-500">{commentCount ? `${category?.commentType} ${commentCount}` : `${category?.commentType}쓰기`}</span>
        </FeedbackButton>
      )}
    </div>
  );
};

export default memo(FeedbackStory, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
