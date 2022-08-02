import { useRouter } from "next/router";
import React from "react";
import { KeyedMutator } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import usePanel from "@libs/client/usePanel";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetStoriesCommentsResponse } from "@api/stories/[id]/comments";
import { GetCommentsDetailResponse } from "@api/comments/[id]";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import ActionPanel, { ActionPanelProps } from "@components/commons/panels/case/actionPanel";

export type HandleCommentItem = GetStoriesCommentsResponse["comments"][0] | GetCommentsDetailResponse["comment"];

export interface HandleCommentProps extends React.HTMLAttributes<HTMLButtonElement> {
  item?: HandleCommentItem;
  mutateComment: KeyedMutator<GetStoriesCommentsResponse> | KeyedMutator<GetCommentsDetailResponse>;
}

const HandleComment = ({ item, mutateComment, className }: HandleCommentProps) => {
  const router = useRouter();

  const { user } = useUser();
  const { openModal } = useModal();
  const { openPanel } = usePanel();

  if (!item) return null;
  if (item.depth < StoryCommentMinimumDepth) null;
  if (item.depth > StoryCommentMaximumDepth) null;
  if (!item?.comment) return null;

  const openOthersPanel = () => {
    openPanel<ActionPanelProps>(ActionPanel, "others", {
      hasBackdrop: true,
      actions:
        user?.id === item.userId
          ? [
              { key: "place", text: "장소추가", onClick: () => console.log("장소추가") },
              { key: "update", text: "수정", onClick: () => console.log("수정") },
              { key: "delete", text: "삭제", onClick: () => console.log("삭제") },
            ]
          : [
              { key: "place", text: "장소추가", onClick: () => console.log("장소추가") },
              { key: "report", text: "댓글 신고", onClick: () => console.log("댓글 신고") },
            ],
      cancelBtn: "닫기",
    });
  };

  return (
    <button type="button" className={`absolute top-0 right-0 ${className}`} onClick={openOthersPanel}>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
    </button>
  );
};

export default React.memo(HandleComment, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return true;
  return false;
});
