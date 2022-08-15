import { useRouter } from "next/router";
import type { HTMLAttributes } from "react";
import { memo } from "react";
import useSWR, { KeyedMutator } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
import usePanel from "@libs/client/usePanel";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetStoriesDetailResponse } from "@api/stories/[id]";
import { GetStoriesCommentsResponse } from "@api/stories/[id]/comments";
import { GetCommentsDetailResponse } from "@api/comments/[id]";
import { PostCommentsDeleteResponse } from "@api/comments/[id]/delete";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import ActionPanel, { ActionPanelProps } from "@components/commons/panels/case/actionPanel";

export type HandleCommentItem = GetStoriesCommentsResponse["comments"][0] | GetCommentsDetailResponse["comment"];

export interface HandleCommentProps extends React.HTMLAttributes<HTMLButtonElement> {
  item?: HandleCommentItem;
  mutateStoryDetail?: KeyedMutator<GetStoriesDetailResponse>;
  mutateStoryComments?: KeyedMutator<GetStoriesCommentsResponse>;
  mutateCommentDetail?: KeyedMutator<GetCommentsDetailResponse>;
}

const HandleComment = (props: HandleCommentProps) => {
  const { item, mutateStoryDetail, mutateStoryComments, mutateCommentDetail, className = "", ...restProps } = props;
  const router = useRouter();
  const { user } = useUser();
  const { openModal } = useModal();
  const { openPanel } = usePanel();

  const [deleteComment, { loading: deleteLoading }] = useMutation<PostCommentsDeleteResponse>(item?.id && typeof item?.updatedAt !== "object" ? `/api/comments/${item?.id}/delete` : "", {
    onSuccess: () => {
      if (mutateStoryDetail) mutateStoryDetail();
      if (mutateStoryComments) mutateStoryComments();
      if (mutateCommentDetail) mutateCommentDetail();
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const openHandlePanel = () => {
    openPanel<ActionPanelProps>(ActionPanel, "handleComment", {
      hasBackdrop: true,
      actions:
        user?.id === item?.userId
          ? [
              { key: "place", text: "장소추가", onClick: () => console.log("장소추가") },
              { key: "update", text: "수정", onClick: () => router.push(`/comments/${item?.id}/edit`) },
              { key: "delete", text: "삭제", onClick: () => openDeleteModal() },
            ]
          : [
              { key: "place", text: "장소추가", onClick: () => console.log("장소추가") },
              { key: "report", text: "댓글 신고", onClick: () => console.log("댓글 신고") },
            ],
      cancelBtn: "닫기",
    });
  };

  // modal: delete
  const openDeleteModal = () => {
    openModal<MessageModalProps>(MessageModal, "ConfirmDeleteComment", {
      type: "confirm",
      message: "삭제하시겠어요?",
      cancelBtn: "취소",
      confirmBtn: "삭제",
      hasBackdrop: true,
      onConfirm: () => {
        if (!item) return;
        if (deleteLoading) return;
        const time = new Date();
        // story boundMutate
        if (mutateStoryComments) {
          mutateStoryComments((prev) => {
            if (!prev) return prev;
            const comments = prev.comments.map((comment) => (comment.id !== item?.id ? comment : { ...comment, content: "", updatedAt: time }));
            return { ...prev, comments };
          }, false);
        }
        // comment boundMutate
        if (mutateCommentDetail) {
          mutateCommentDetail((prev) => {
            if (!prev) return prev;
            if (router?.query?.id?.toString() === item?.id?.toString()) return { ...prev, comment: { ...prev.comment, content: "", updatedAt: time } };
            const reComments = (prev?.comment?.reComments || [])?.map((comment) => (comment.id !== item?.id ? comment : { ...comment, content: "", updatedAt: time }));
            return { ...prev, comment: { ...prev.comment, reComments } };
          }, false);
        }
        deleteComment({});
      },
    });
  };

  if (!item) return null;
  if (!item.content) return null;
  if (item.depth < StoryCommentMinimumDepth) return null;
  if (item.depth > StoryCommentMaximumDepth) return null;

  return (
    <button type="button" className={`absolute top-0 right-0 ${className}`} onClick={openHandlePanel} {...restProps}>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
    </button>
  );
};

export default memo(HandleComment, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.content !== next?.item?.content) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
