import Link from "next/link";
import type { HTMLAttributes } from "react";
import { useEffect, useState } from "react";
// @libs
import { getDiffTimeStr } from "@libs/utils";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetCommentsDetailResponse } from "@api/comments/[id]";
import { GetStoriesCommentsResponse } from "@api/stories/[id]/comments";
// @components
import Profiles, { ProfilesProps } from "@components/profiles";

export type CommentItem = GetStoriesCommentsResponse["comments"][number] | GetCommentsDetailResponse["comment"];

export interface CommentProps extends HTMLAttributes<HTMLDivElement> {
  item: CommentItem;
}

const Comment = (props: CommentProps) => {
  const { item, className = "", ...restProps } = props;

  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const isEdited = new Date(item?.updatedAt).getTime() - new Date(item?.createdAt).getTime() > 100;
  const diffTime = !isEdited ? getDiffTimeStr(new Date(item?.createdAt).getTime(), today.getTime()) : getDiffTimeStr(new Date(item?.updatedAt).getTime(), today.getTime()) + " 수정";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item) return null;
  if (item.depth < StoryCommentMinimumDepth) return null;
  if (item.depth > StoryCommentMaximumDepth) return null;
  if (!item?.content) return <p className="text-notice opacity-60">댓글 작성자가 삭제한 댓글이에요</p>;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <Link href={`/profiles/${item?.user?.id}`}>
        <a className="block">
          <Profiles user={item?.user} signature={item?.story?.userId === item?.user?.id ? "작성자" : ""} emdPosNm={item?.emdPosNm} diffTime={mounted && diffTime ? diffTime : ""} size="tiny" />
        </a>
      </Link>
      <div className="mt-1 pl-11">
        <p>{item.content}</p>
      </div>
    </div>
  );
};

export default Comment;
