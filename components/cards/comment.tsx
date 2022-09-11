import Link from "next/link";
import type { HTMLAttributes } from "react";
// @libs
import useTimeDiff from "@libs/client/useTimeDiff";
// @api
import { CommentMinimumDepth, CommentMaximumDepth } from "@api/comments/types";
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

  // variable: visible
  const isEdited = new Date(item?.updatedAt).getTime() - new Date(item?.createdAt).getTime() > 100;
  const { isMounted, timeState } = useTimeDiff((!isEdited ? new Date(item?.createdAt).toString() : new Date(item?.updatedAt).toString()) || null);

  if (!item) return null;
  if (item.depth < CommentMinimumDepth) return null;
  if (item.depth > CommentMaximumDepth) return null;
  if (!item?.content) return <p className="text-notice opacity-60">댓글 작성자가 삭제한 댓글이에요</p>;

  return (
    <div className={`relative ${className}`} {...restProps}>
      {item?.user && (
        <Link href={`/profiles/${item?.user?.id}`}>
          <a className="block">
            <Profiles
              user={item?.user}
              signature={item?.story?.userId === item?.user?.id ? "작성자" : ""}
              emdPosNm={item?.emdPosNm}
              diffTime={isMounted && timeState.diffStr ? timeState.diffStr : ""}
              size="tiny"
            />
          </a>
        </Link>
      )}
      <div className="mt-1 pl-11">
        <p>{item.content}</p>
      </div>
    </div>
  );
};

export default Comment;
