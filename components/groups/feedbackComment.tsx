import { useRouter } from "next/router";
import React from "react";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetStoriesCommentsResponse } from "@api/stories/[id]/comments";
import { GetCommentsDetailResponse } from "@api/comments/[id]";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";

export type FeedbackCommentItem = GetStoriesCommentsResponse["comments"][0] | GetCommentsDetailResponse["comment"];

export interface FeedbackCommentProps {
  item?: FeedbackCommentItem;
}

const FeedbackComment = ({ item }: FeedbackCommentProps) => {
  const router = useRouter();
  const { user, currentAddr } = useUser();
  const { openModal } = useModal();

  const { data, mutate: boundMutate } = useSWR<GetCommentsDetailResponse>(item?.id && typeof item?.updatedAt !== "object" ? `/api/comments/${item.id}` : null);
  const [updateLike, { loading: likeLoading }] = useMutation(data ? `/api/comments/${item?.id}/like` : "", {
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

  const likeRecord = data?.comment?.records?.find((record) => record.userId === user?.id && record.kind === Kind.CommentLike);
  const likeRecords = data?.comment?.records?.filter((record) => record.kind === Kind.CommentLike) || [];

  // like
  const clickLike = () => {
    !user?.id ? openWelcomeModal() : user?.id === -1 ? openSignUpModal() : toggleLike();
  };
  const toggleLike = () => {
    if (!data) return;
    if (likeLoading) return;
    const isLike = !Boolean(likeRecord);
    boundMutate((prev) => {
      let records = prev?.comment?.records ? [...prev.comment.records] : [];
      const idx = records.findIndex((record) => record.id === likeRecord?.id);
      if (!isLike) records.splice(idx, 1);
      if (isLike) records.push({ id: 0, kind: Kind.CommentLike, userId: user?.id! });
      return prev && { ...prev, comment: { ...prev.comment, records: records } };
    }, false);
    updateLike({});
  };

  // comment
  const clickComment = () => {
    if (router.pathname === "/comments/[id]" && router?.query?.id?.toString() === item?.id.toString()) {
      (document.querySelector(".container input#content") as HTMLInputElement)?.focus();
    } else {
      router.push(`/comments/${item?.id}`);
    }
  };

  // modal: welcome
  const openWelcomeModal = () => {
    openModal<MessageModalProps>(MessageModal, "welcome", {
      type: "confirm",
      message: "당근마켓 첫 방문이신가요?",
      cancelBtn: "취소",
      confirmBtn: "당근마켓 시작하기",
      hasBackdrop: true,
      onConfirm: () => {
        router.push("/welcome");
      },
    });
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
        router.push({
          pathname: "/join",
          query: { addrNm: currentAddr?.emdAddrNm },
        });
      },
    });
  };

  if (!item) return null;
  if (!item.content) return null;
  if (item.depth < StoryCommentMinimumDepth) return null;
  if (item.depth > StoryCommentMaximumDepth) return null;

  return (
    <div className="pl-11 space-x-2">
      {/* 좋아요: button */}
      <button type="button" onClick={clickLike}>
        <span className={`text-sm ${likeRecord ? "text-orange-500" : "text-gray-500"}`}>좋아요 {likeRecords.length || null}</span>
      </button>
      {/* 답글: button */}
      {item.depth < StoryCommentMaximumDepth && (
        <button type="button" onClick={clickComment}>
          <span className="text-sm text-gray-500">답글쓰기</span>
        </button>
      )}
    </div>
  );
};

export default React.memo(FeedbackComment, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.content !== next?.item?.content) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
