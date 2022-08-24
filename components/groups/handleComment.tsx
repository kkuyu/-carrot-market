import { useRouter } from "next/router";
import type { HTMLAttributes } from "react";
import { memo } from "react";
import useSWR, { KeyedMutator } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetStoriesDetailResponse } from "@api/stories/[id]";
import { GetStoriesCommentsResponse } from "@api/stories/[id]/comments";
import { GetCommentsDetailResponse } from "@api/comments/[id]";
import { PostCommentsDeleteResponse } from "@api/comments/[id]/delete";
// @components
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";
import ActionModal, { ActionModalProps, ActionStyleEnum } from "@components/commons/modals/case/actionModal";
import Buttons, { ButtonsProps } from "@components/buttons";
import Icons from "@components/icons";

export type HandleCommentItem = GetStoriesCommentsResponse["comments"][number] | GetCommentsDetailResponse["comment"];

export interface HandleCommentProps extends HTMLAttributes<HTMLButtonElement> {
  item?: HandleCommentItem;
  size?: ButtonsProps<"button">["size"];
  mutateStoryDetail?: KeyedMutator<GetStoriesDetailResponse>;
  mutateStoryComments?: KeyedMutator<GetStoriesCommentsResponse>;
  mutateCommentDetail?: KeyedMutator<GetCommentsDetailResponse>;
}

const HandleComment = (props: HandleCommentProps) => {
  const { item, mutateStoryDetail, mutateStoryComments, mutateCommentDetail, className = "", ...restProps } = props;
  const router = useRouter();
  const { user } = useUser();
  const { openModal } = useModal();

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
    const modalActions = [
      { key: "place", style: ActionStyleEnum["default"], text: "장소추가", handler: () => console.log("장소추가") },
      { key: "update", style: ActionStyleEnum["default"], text: "수정", handler: () => router.push(`/comments/${item?.id}/edit`) },
      { key: "delete", style: ActionStyleEnum["destructive"], text: "삭제", handler: () => openDeleteModal() },
      { key: "report", style: ActionStyleEnum["destructive"], text: "댓글 신고", handler: () => console.log("댓글 신고") },
      { key: "cancel", style: ActionStyleEnum["cancel"], text: "취소", handler: null },
    ];
    openModal<ActionModalProps>(ActionModal, "handleComment", {
      actions:
        user?.id === item?.userId
          ? modalActions.filter((action) => ["place", "update", "delete", "cancel"].includes(action.key))
          : modalActions.filter((action) => ["place", "report"].includes(action.key)),
    });
  };

  // modal: delete
  const openDeleteModal = () => {
    openModal<AlertModalProps>(AlertModal, "ConfirmDeleteComment", {
      message: "삭제하시겠어요?",
      actions: [
        {
          key: "cancel",
          style: AlertStyleEnum["cancel"],
          text: "취소",
          handler: null,
        },
        {
          key: "destructive",
          style: AlertStyleEnum["destructive"],
          text: "삭제",
          handler: () => {
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
        },
      ],
    });
  };

  if (!item) return null;
  if (!item.content) return null;
  if (item.depth < StoryCommentMinimumDepth) return null;
  if (item.depth > StoryCommentMaximumDepth) return null;

  return (
    <Buttons tag="button" type="button" sort="icon-block" size="sm" status="unset" onClick={openHandlePanel} className={`absolute top-0 right-0 ${className}`} {...restProps}>
      <Icons name="EllipsisVertical" className="w-5 h-5 text-gray-400" />
    </Buttons>
  );
};

export default memo(HandleComment, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.content !== next?.item?.content) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
