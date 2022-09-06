import type { HTMLAttributes, ReactElement } from "react";
import { Children, cloneElement, isValidElement, useEffect, useState } from "react";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth, StoryCommentReadTypeEnum } from "@api/stories/types";
// @components
import Comment, { CommentItem, CommentProps } from "@components/cards/comment";
import { HandleCommentProps } from "@components/groups/handleComment";
import { FeedbackCommentProps } from "@components/groups/feedbackComment";
import Buttons from "@components/buttons";

interface CommentTreeListProps extends HTMLAttributes<HTMLDivElement> {
  list?: CommentItem[];
  depth?: number;
  reCommentRefId?: number;
  countReComments?: number;
  moreReComments?: (readType: StoryCommentReadTypeEnum, reCommentRefId: number, prevCursor: number) => void;
  cardProps?: Partial<CommentProps>;
  children?: ReactElement | ReactElement[];
}

const CommentTreeList = (props: CommentTreeListProps) => {
  const { list = [], depth = StoryCommentMinimumDepth, reCommentRefId = 0, countReComments = 0, moreReComments, cardProps = {}, children, className = "", ...restProps } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [readState, setReadState] = useState<{ type: StoryCommentReadTypeEnum; counts: number | null }>({ type: "more", counts: null });

  const readMoreReComments = () => {
    if (!reCommentRefId) return;
    if (!moreReComments) return;
    setIsLoading(true);
    moreReComments(readState.type, reCommentRefId, !list.length ? 0 : list[list.length - 1].id);
  };

  useEffect(() => {
    setIsLoading(false);
    setReadState((prev) => {
      const type = list.length === countReComments || (prev.type === "fold" && prev.counts === countReComments) ? "fold" : "more";
      return { type, counts: type === "fold" ? countReComments : null };
    });
  }, [list.length, countReComments]);

  if (!Boolean(list.length) && !countReComments) return null;
  if (depth < StoryCommentMinimumDepth) return null;
  if (depth > StoryCommentMaximumDepth) return null;

  return (
    <div className={`${depth !== 0 ? "pl-11" : ""} ${className}`} {...restProps}>
      {/* 답글: list */}
      {Boolean(list.length) && (
        <ul className="mt-2 space-y-3">
          {list?.map((item) => {
            const { reComments: list, _count, ...itemData } = item;
            const childInfo = { depth: item.depth + 1, reCommentRefId: item.id, countReComments: _count?.reComments };
            const childrenWithProps = Children.map(children, (child) => {
              if (isValidElement(child)) {
                if (child.key === "HandleComment") return cloneElement(child as ReactElement<HandleCommentProps>, { item: itemData });
                if (child.key === "FeedbackComment") return cloneElement(child as ReactElement<FeedbackCommentProps>, { item: itemData });
                if (child.key === "CommentTreeList") return cloneElement(child as ReactElement<CommentTreeListProps>, { list, cardProps, moreReComments, children, ...childInfo });
              }
              return child;
            });
            return (
              <li key={item.id} className="relative">
                <Comment item={itemData} {...cardProps} />
                {childrenWithProps}
              </li>
            );
          })}
        </ul>
      )}
      {/* 답글: read more */}
      {Boolean(countReComments) && depth !== StoryCommentMinimumDepth && (
        <div className="relative pl-3 mt-1">
          <Buttons tag="button" type="button" sort="text-link" size="sm" status="unset" onClick={readMoreReComments} disabled={isLoading}>
            <span className="text-gray-500">
              {isLoading ? "답글을 불러오고있어요" : list?.length === countReComments ? "답글 숨기기" : list.length > 2 ? "이전 답글 더보기" : `답글 ${countReComments - list.length}개 보기`}
            </span>
            <span className="absolute top-1.5 left-0 w-2 h-2 border-l border-b border-gray-400" />
          </Buttons>
        </div>
      )}
    </div>
  );
};

export default CommentTreeList;
