import { useRouter } from "next/router";
import { FocusEvent, useState } from "react";
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
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";

export type FeedbackStoryItem = GetStoriesResponse["stories"][0] | GetStoriesDetailResponse["story"];

export interface FeedbackStoryProps {
  item?: FeedbackStoryItem;
  commentCount?: number;
}

const FeedbackStory = ({ item, commentCount }: FeedbackStoryProps) => {
  const router = useRouter();
  const isDetailPage = router.pathname === "/stories/[id]";

  const { user, currentAddr } = useUser();
  const { openModal } = useModal();

  const [isVisibleBox, setIsVisibleBox] = useState(false);

  const { data, error, mutate: boundMutate } = useSWR<GetStoriesDetailResponse>(item?.id ? `/api/stories/${item.id}` : null);
  const [updateLike, { loading: likeLoading }] = useMutation(item?.id ? `/api/stories/${item.id}/like` : "", {
    onSuccess: (data) => {
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

  if (!item) return null;

  const category = getStoryCategory(item?.category);
  const likeRecords = data?.story?.records?.filter((record) => record.kind === Kind.StoryLike) || [];
  const liked = likeRecords.find((record) => record.userId === user?.id);
  const count = commentCount ? commentCount : item?.comments?.length;

  // toggle like
  const toggleLike = (emotion?: EmotionKeys) => {
    if (!data) return;
    if (likeLoading) return;

    boundMutate((prev) => {
      let records = prev?.story?.records ? [...prev.story.records] : [];
      const idx = records.findIndex((record) => record.kind === Kind.StoryLike && record.userId === user?.id);
      const exists = idx !== -1;

      if (!emotion) {
        if (exists) records.splice(idx, 1);
        if (!exists) records.push({ id: 0, kind: Kind.StoryLike, emotion: null, userId: user?.id! });
        return prev && { ...prev, story: { ...prev.story, records: records } };
      } else {
        if (exists) records[idx].emotion !== emotion ? records.splice(idx, 1, { ...records[idx], emotion }) : records.splice(idx, 1);
        if (!exists) records.push({ id: 0, kind: Kind.StoryLike, emotion: emotion, userId: user?.id! });
      }
      return prev && { ...prev, story: { ...prev.story, records: records } };
    }, false);
    updateLike({ emotion: emotion || null });
  };

  // click emotion
  const emotionButtonClick = () => setIsVisibleBox((prev) => !prev);
  const emotionButtonBlur = (e: FocusEvent<HTMLButtonElement, Element>) => {
    const boxEl = e.relatedTarget?.closest(".emotionBox");
    if (boxEl?.isSameNode(e.relatedTarget)) return;
    if (boxEl?.contains(e.relatedTarget)) return;
    setIsVisibleBox(false);
  };
  const emotionBoxClick = (key: EmotionKeys) => {
    user?.id === -1 ? openSignUpModal() : toggleLike(key);
    setIsVisibleBox(false);
  };
  const emotionBoxBlur = (e: FocusEvent<HTMLDivElement, Element>) => {
    const boxEl = e.target.closest(".emotionBox");
    const prevEl = boxEl?.previousElementSibling as HTMLElement;
    if (boxEl?.isSameNode(e.relatedTarget)) return;
    if (boxEl?.contains(e.relatedTarget)) return;
    prevEl?.focus();
    setIsVisibleBox(false);
  };

  // click comment
  const commentClick = () => {
    if (isDetailPage) {
      const target = document.querySelector(".container input#comment") as HTMLInputElement;
      target?.focus();
    } else {
      router.push(`/stories/${item.id}`);
    }
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

  return (
    <div className="relative px-5 border-t">
      {/* 궁금해요: button */}
      {!category?.isLikeWithEmotion && (
        <button type="button" onClick={() => (user?.id === -1 ? openSignUpModal() : toggleLike())} className="py-2">
          <svg className={`inline-block w-5 h-5 ${liked ? "text-orange-500" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className={`ml-1 text-sm ${liked ? "text-orange-500" : "text-gray-500"}`}>궁금해요 {likeRecords.length || null}</span>
        </button>
      )}
      {/* 공감하기: button */}
      {category?.isLikeWithEmotion && (
        <button type="button" onClick={emotionButtonClick} onBlur={emotionButtonBlur} className="py-2">
          {!liked ? (
            <svg className="inline-block w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <span className="inline-block w-5 h-5">{EmotionIcon?.[liked.emotion!]}</span>
          )}
          {!liked ? <span className="ml-1 text-sm text-gray-500">공감하기</span> : <span className="ml-1 text-sm text-orange-500">공감했어요</span>}
        </button>
      )}
      {/* 공감하기: box */}
      {category?.isLikeWithEmotion && (
        <div onBlur={emotionBoxBlur} className={`absolute bottom-12 left-5 scale-0 origin-bottom-left transition-all ${isVisibleBox ? "visible scale-100" : "invisible"} emotionBox`} tabIndex={0}>
          <div className="px-2 bg-white border border-gray-300 rounded-lg">
            {Object.entries(EmotionIcon).map(([key, emotion]) => (
              <button key={emotion} type="button" onClick={() => emotionBoxClick(key as EmotionKeys)} className="p-1">
                {emotion}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* 공감하기: result */}
      {category?.isLikeWithEmotion && Boolean(likeRecords.length) && (
        <div className="absolute bottom-0 right-0 flex items-center h-10 pr-5">
          <span className="text-sm">
            {likeRecords
              .map((record) => record.emotion)
              .filter((emotion, index, array) => array.indexOf(emotion) === index)
              .map((emotion) => (
                <span key={emotion}>{EmotionIcon?.[emotion!]}</span>
              ))}
          </span>
          <span className="ml-1 block text-sm text-gray-500">{likeRecords.length}</span>
        </div>
      )}
      {/* 댓글 */}
      <button type="button" className="ml-4 py-2" onClick={commentClick}>
        <svg className="inline-block w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          ></path>
        </svg>
        <span className="ml-1 text-sm text-gray-500">{count ? `댓글 ${count}` : "댓글쓰기"}</span>
      </button>
    </div>
  );
};

export default FeedbackStory;
