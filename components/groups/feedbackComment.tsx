import { useRouter } from "next/router";
import type { HTMLAttributes } from "react";
import { memo } from "react";
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
import { PostCommentsLikeResponse } from "@api/comments/[id]/like";
// @components
import WelcomeAlertModal, { WelcomeAlertModalProps, WelcomeAlertModalName } from "@components/commons/modals/instance/welcomeAlertModal";
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";

export type FeedbackCommentItem = GetStoriesCommentsResponse["comments"][0] | GetCommentsDetailResponse["comment"];

export interface FeedbackCommentProps extends HTMLAttributes<HTMLDivElement> {
  item?: FeedbackCommentItem;
}

const FeedbackComment = (props: FeedbackCommentProps) => {
  const { item, className = "", ...restProps } = props;
  const router = useRouter();
  const { user, type: userType } = useUser();
  const { openModal } = useModal();

  const { data, mutate: boundMutate } = useSWR<GetCommentsDetailResponse>(item?.id && typeof item?.updatedAt !== "object" ? `/api/comments/${item.id}` : null);
  const [updateLike, { loading: likeLoading }] = useMutation<PostCommentsLikeResponse>(data ? `/api/comments/${item?.id}/like` : "", {
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

  const likeRecord = data?.comment?.records?.find((record) => record.userId === user?.id && record.kind === Kind.CommentLike);
  const likeRecords = data?.comment?.records?.filter((record) => record.kind === Kind.CommentLike) || [];

  // like
  const clickLike = () => {
    if (userType === "member") toggleLike();
    if (userType === "non-member") openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {});
    if (userType === "guest") openModal<WelcomeAlertModalProps>(WelcomeAlertModal, WelcomeAlertModalName, {});
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

  if (!item) return null;
  if (!item.content) return null;
  if (item.depth < StoryCommentMinimumDepth) return null;
  if (item.depth > StoryCommentMaximumDepth) return null;

  return (
    <div className={`pl-11 space-x-2 ${className}`} {...restProps}>
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

export default memo(FeedbackComment, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.content !== next?.item?.content) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
