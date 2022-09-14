import { useRouter } from "next/router";
import Link from "next/link";
import type { HTMLAttributes, ReactElement, FocusEvent } from "react";
import { useState, useRef, memo } from "react";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import { getStoryCondition } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
// @api
import { CommentEmotionIcon } from "@api/comments/types";
import { GetStoriesResponse } from "@api/stories";
import { GetStoriesDetailResponse } from "@api/stories/[id]";
import { PostStoriesLikeResponse } from "@api/stories/[id]/like";
// @components
import WelcomeAlertModal, { WelcomeAlertModalProps, WelcomeAlertModalName } from "@components/commons/modals/instance/welcomeAlertModal";
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
import Icons from "@components/icons";
import Buttons from "@components/buttons";

export type FeedbackStoryItem = GetStoriesResponse["stories"][number];

export interface FeedbackStoryProps extends HTMLAttributes<HTMLDivElement> {
  item?: FeedbackStoryItem;
}

const FeedbackStory = (props: FeedbackStoryProps) => {
  const { item, className = "", ...restProps } = props;
  const router = useRouter();
  const { user, type: userType } = useUser();
  const { openModal } = useModal();

  // variable: invisible
  const [isVisibleBox, setIsVisibleBox] = useState(false);
  const emotionBox = useRef<HTMLDivElement | null>(null);

  // fetch data
  const { data: storyData, mutate: mutateStory } = useSWR<GetStoriesDetailResponse>(item?.id ? `/api/stories/${item.id}` : null, {
    ...(item ? { fallbackData: { success: true, story: item, productCondition: getStoryCondition(item, user?.id) } } : {}),
  });

  // mutation data
  const [updateProductLike, { loading: loadingProductLike }] = useMutation<PostStoriesLikeResponse>(item?.id ? `/api/stories/${item.id}/like` : "", {
    onSuccess: async () => {
      await mutateStory();
    },
  });

  // update: story.record
  const toggleLike = (emotion: null | keyof CommentEmotionIcon = null) => {
    if (!storyData) return;
    if (loadingProductLike) return;
    const currentCondition = storyData?.storyCondition ?? getStoryCondition(storyData?.story!, user?.id);
    mutateStory((prev) => {
      let records = prev?.story?.records ? [...prev.story.records] : [];
      if (currentCondition?.isLike && emotion && emotion === currentCondition?.emotion) records = records.filter((record) => !(record.kind === Kind.StoryLike && record.userId == user?.id));
      if (currentCondition?.isLike && emotion && emotion !== currentCondition?.emotion)
        records = records.map((record) => (!(record.kind === Kind.StoryLike && record.userId == user?.id) ? { ...record } : { ...record, emotion }));
      if (currentCondition?.isLike && !emotion) records = records.filter((record) => !(record.kind === Kind.StoryLike && record.userId == user?.id));
      if (!currentCondition?.isLike) records = [...records, { id: 0, kind: Kind.StoryLike, emotion, userId: user?.id! }];
      return prev && { ...prev, story: { ...prev.story, records: records }, storyCondition: getStoryCondition({ ...storyData?.story, records }, user?.id) };
    }, false);
    updateProductLike({ like: !currentCondition?.isLike, emotion });
  };

  if (!item) return null;

  const CustomFeedbackButton = (buttonProps: { pathname?: string; children: ReactElement | ReactElement[] } & HTMLAttributes<HTMLButtonElement | HTMLAnchorElement>) => {
    const { pathname, onClick, className: buttonClassName = "", children, ...buttonRestProps } = buttonProps;
    if (!pathname) {
      return (
        <Buttons tag="button" type="button" sort="text-link" size="sm" status="unset" onClick={onClick} className={`inline-flex items-center py-1.5 ${buttonClassName}`} {...buttonRestProps}>
          {children}
        </Buttons>
      );
    }
    return (
      <Link href={pathname} passHref>
        <Buttons tag="a" sort="text-link" size="sm" status="unset" className={`inline-flex items-center py-1.5 ${buttonClassName}`} {...buttonRestProps}>
          {children}
        </Buttons>
      </Link>
    );
  };

  return (
    <div className={`empty:pt-8 relative flex border-t ${className}`} {...restProps}>
      {/* 궁금해요: button */}
      {storyData?.storyCondition && !storyData?.storyCondition?.category?.isLikeWithEmotion && (
        <CustomFeedbackButton
          onClick={() => {
            if (userType === "member") toggleLike();
            if (userType === "non-member") openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {});
            if (userType === "guest") openModal<WelcomeAlertModalProps>(WelcomeAlertModal, WelcomeAlertModalName, {});
          }}
        >
          <Icons name="QuestionMarkCircleSolid" className={`w-5 h-5 ${storyData?.storyCondition?.isLike ? "text-orange-500" : "text-gray-500"}`} />
          <span className={`ml-1 ${storyData?.storyCondition?.isLike ? "text-orange-500" : "text-gray-500"}`}>궁금해요 {storyData?.storyCondition?.likes || null}</span>
        </CustomFeedbackButton>
      )}
      {/* 공감하기: button */}
      {storyData?.storyCondition && storyData?.storyCondition?.category?.isLikeWithEmotion && (
        <CustomFeedbackButton
          onClick={() => setIsVisibleBox((prev) => !prev)}
          onBlur={(e: FocusEvent<HTMLButtonElement, Element>) => {
            if (emotionBox?.current?.isSameNode(e.relatedTarget)) return;
            if (emotionBox?.current?.contains(e.relatedTarget)) return;
            setIsVisibleBox(false);
          }}
        >
          {!storyData?.storyCondition?.isLike ? <Icons name="FaceSmile" className="w-5 h-5 text-gray-500" /> : <span className="w-5 h-5">{storyData?.storyCondition?.emoji}</span>}
          {!storyData?.storyCondition?.isLike ? <span className="ml-1 text-sm text-gray-500">공감하기</span> : <span className="ml-1 text-sm text-orange-500">공감했어요</span>}
        </CustomFeedbackButton>
      )}
      {/* 공감하기: box */}
      {storyData?.storyCondition && storyData?.storyCondition?.category?.isLikeWithEmotion && (
        <div
          ref={emotionBox}
          onBlur={(e: FocusEvent<HTMLDivElement, Element>) => {
            const prevEl = emotionBox?.current?.previousElementSibling as HTMLElement;
            if (emotionBox?.current?.isSameNode(e.relatedTarget)) return;
            if (emotionBox?.current?.contains(e.relatedTarget)) return;
            prevEl?.focus();
            setIsVisibleBox(false);
          }}
          className={`absolute bottom-11 left-0 scale-0 origin-bottom-left transition-all ${isVisibleBox ? "visible scale-100" : "invisible"} emotionBox`}
          tabIndex={0}
        >
          <div className="px-2 bg-white border border-gray-300 rounded-lg">
            {Object.entries(CommentEmotionIcon).map(([key, emotion]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (userType === "member") toggleLike(key as keyof CommentEmotionIcon);
                  if (userType === "non-member") openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {});
                  if (userType === "guest") openModal<WelcomeAlertModalProps>(WelcomeAlertModal, WelcomeAlertModalName, {});
                  setIsVisibleBox(false);
                }}
                className="p-1"
              >
                {emotion.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* 공감하기: result */}
      {storyData?.storyCondition && storyData?.storyCondition?.category?.isLikeWithEmotion && Boolean(storyData?.storyCondition?.likes) && (
        <div className="absolute top-1/2 right-0 inline-flex items-center -translate-y-1/2">
          <span>{storyData.storyCondition.emojis}</span>
          <span className="ml-1 text-sm text-gray-500">{storyData?.storyCondition?.likes}</span>
        </div>
      )}
      {/* 댓글/답변 */}
      {storyData?.storyCondition && router.pathname === "/stories/[id]" && (
        <CustomFeedbackButton onClick={() => (document.querySelector(".container input#content") as HTMLInputElement)?.focus()} className="last:ml-4">
          <Icons name="ChatBubbleOvalLeftEllipsis" className="w-5 h-5 text-gray-500" />
          <span className="ml-1 text-sm text-gray-500">
            {storyData?.storyCondition?.comments
              ? `${storyData?.storyCondition?.category?.commentType} ${storyData?.storyCondition?.comments}`
              : `${storyData?.storyCondition?.category?.commentType}쓰기`}
          </span>
        </CustomFeedbackButton>
      )}
      {storyData?.storyCondition && router.pathname !== "/stories/[id]" && (
        <CustomFeedbackButton pathname={`/stories/${item?.id}`} className="last:ml-4">
          <Icons name="ChatBubbleOvalLeftEllipsis" className="w-5 h-5 text-gray-500" />
          <span className="ml-1 text-sm text-gray-500">
            {storyData?.storyCondition?.comments
              ? `${storyData?.storyCondition?.category?.commentType} ${storyData?.storyCondition?.comments}`
              : `${storyData?.storyCondition?.category?.commentType}쓰기`}
          </span>
        </CustomFeedbackButton>
      )}
    </div>
  );
};

export default memo(FeedbackStory, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
