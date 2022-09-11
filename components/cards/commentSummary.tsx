import type { HTMLAttributes } from "react";
// @libs
import { getCommentCondition, truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useTimeDiff from "@libs/client/useTimeDiff";
// @api
import { CommentMinimumDepth, CommentMaximumDepth } from "@api/comments/types";
import { StoryCommentCondition } from "@api/comments/[id]";
import { GetProfilesStoriesResponse } from "@api/profiles/[id]/stories/[filter]";
// @components
import Icons from "@components/icons";

export type CommentSummaryItem = GetProfilesStoriesResponse["comments"][number];

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
      <span className="block pr-16 text-sm text-gray-500">{`"${truncateStr(item?.story?.content, 10)}"에서 ${isMounted && timeState.diffStr ? timeState.diffStr : ""}`}</span>
      <span className="absolute bottom-0 right-0 flex items-center space-x-0.5 text-sm text-gray-400">
        {commentCondition && Boolean(commentCondition?.likes) && (
          <>
            <Icons name="HandThumbUp" className="flex-none w-5 h-5 pl-1" />
            <span>{commentCondition.likes}</span>
          </>
        )}
      </span>
    </div>
  );
};

export default CommentSummary;
