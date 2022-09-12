import type { HTMLAttributes } from "react";
// @libs
import { getCommentCondition, truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useTimeDiff from "@libs/client/useTimeDiff";
// @api
import { CommentMinimumDepth, CommentMaximumDepth } from "@api/comments/types";
import { StoryCommentCondition } from "@api/comments/[id]";
import { GetProfilesDetailCommentsResponse } from "@api/profiles/[id]/comments/[filter]";
// @components
import Icons from "@components/icons";

export type CommentSummaryItem = GetProfilesDetailCommentsResponse["comments"][number];

export interface CommentSummaryProps extends HTMLAttributes<HTMLDivElement> {
  item: CommentSummaryItem;
  condition?: StoryCommentCondition;
}

const CommentSummary = (props: CommentSummaryProps) => {
  const { item, condition, className = "", ...restProps } = props;
  const { user } = useUser();

  // variable: visible
  const isEdited = new Date(item?.updatedAt).getTime() - new Date(item?.createdAt).getTime() > 100;
  const { isMounted, timeState } = useTimeDiff((!isEdited ? new Date(item?.createdAt).toString() : new Date(item?.updatedAt).toString()) || null);
  const commentCondition = condition ?? getCommentCondition(item, user?.id);

  if (!item) return null;
  if (item.depth < CommentMinimumDepth) return null;
  if (item.depth > CommentMaximumDepth) return null;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <p>{item.content}</p>
      <div className="mt-2 flex flex-wrap justify-between">
        <div className="text-description text-sm">
          <span>{`"${truncateStr(item?.story?.content, 10)}"에서 ${isMounted && timeState.diffStr ? timeState.diffStr : ""}`}</span>
        </div>
        <div className="flex">
          <span className="inline-flex items-center">
            <Icons name="HandThumbUp" className="w-4 h-4 text-gray-500" />
            <span className="ml-1 text-sm text-gray-500">{commentCondition?.likes}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommentSummary;
