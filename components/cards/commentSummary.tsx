import { useEffect, useState } from "react";
// @libs
import { getDiffTimeStr, truncateStr } from "@libs/utils";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetProfilesStoriesResponse } from "@api/users/profiles/[id]/stories";

export type CommentSummaryItem = GetProfilesStoriesResponse["comments"][0];

export interface CommentProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  item: CommentSummaryItem;
}

const Comment = ({ item, ...rest }: CommentProps) => {
  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const isEdited = new Date(item?.updatedAt).getTime() - new Date(item?.createdAt).getTime() > 100;
  const diffTime = !isEdited ? getDiffTimeStr(new Date(item?.createdAt).getTime(), today.getTime()) + " 작성" : getDiffTimeStr(new Date(item?.updatedAt).getTime(), today.getTime()) + " 수정";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item) return null;
  if (item.depth < StoryCommentMinimumDepth) null;
  if (item.depth > StoryCommentMaximumDepth) null;

  return (
    <div className="relative" {...rest}>
      <p>{item.content}</p>
      <span className="block mt-2 text-gray-500 text-sm">{`"${truncateStr(item?.story?.content, 10)}"에서 ${mounted ? diffTime : ""}`}</span>
    </div>
  );
};

export default Comment;
