import type { HTMLAttributes } from "react";
import { useEffect, useState } from "react";
// @libs
import { getDiffTimeStr, truncateStr } from "@libs/utils";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetProfilesStoriesResponse } from "@api/profiles/[id]/stories/[filter]";

export type CommentSummaryItem = GetProfilesStoriesResponse["comments"][number];

export interface CommentSummaryProps extends HTMLAttributes<HTMLDivElement> {
  item: CommentSummaryItem;
}

const CommentSummary = (props: CommentSummaryProps) => {
  const { item, className = "", ...restProps } = props;

  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const isEdited = new Date(item?.updatedAt).getTime() - new Date(item?.createdAt).getTime() > 100;
  const diffTime = !isEdited ? getDiffTimeStr(new Date(item?.createdAt).getTime(), today.getTime()) + " 작성" : getDiffTimeStr(new Date(item?.updatedAt).getTime(), today.getTime()) + " 수정";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item) return null;
  if (item.depth < StoryCommentMinimumDepth) return null;
  if (item.depth > StoryCommentMaximumDepth) return null;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <p>{item.content}</p>
      <span className="text-sm text-gray-500">{`"${truncateStr(item?.story?.content, 10)}"에서 ${mounted && diffTime ? diffTime : ""}`}</span>
    </div>
  );
};

export default CommentSummary;
