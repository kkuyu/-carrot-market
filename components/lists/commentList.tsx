import { useRouter } from "next/router";
import { Children, cloneElement, isValidElement, useState } from "react";
// @libs
import useUser from "@libs/client/useUser";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
// @components
import Comment, { CommentItem } from "@components/cards/comment";
import FeedbackComment, { FeedbackCommentProps } from "@components/groups/feedbackComment";

interface CommentListProps {
  list?: CommentItem[];
  depth?: number;
  reCommentRefId?: number;
  countReComments?: number;
  moreReComments?: (reCommentRefId: number, page: number) => void;
  children?: React.ReactNode;
}

const CommentList = ({ list = [], depth = 0, reCommentRefId = 0, countReComments = 0, moreReComments, children }: CommentListProps) => {
  const router = useRouter();
  const { user } = useUser();

  const [page, setPage] = useState(depth === 0 ? -1 : !Boolean(list.length) ? 0 : 1);
  const takeLength = page === -1 ? list.length : page === 0 ? 0 : (page - 2) * 10 + 11 + 1;
  const isVisibleReCommentButton = router.pathname === "/stories/[id]" && Boolean(list.length) && depth >= StoryCommentMinimumDepth + 1 && depth <= StoryCommentMaximumDepth;

  const clickMore = () => {
    if (!reCommentRefId) return;
    if (!moreReComments) return;
    const newPage = page + 1;
    setPage(newPage);
    moreReComments(reCommentRefId, newPage);
  };

  const clickComment = () => {
    router.push(`/comments/${reCommentRefId}`);
  };

  if (!Boolean(list.length) && !countReComments) return null;
  if (depth < StoryCommentMinimumDepth) return null;
  if (depth > StoryCommentMaximumDepth) return null;

  return (
    <div className={`${depth !== 0 ? "pl-11" : ""}`}>
      {/* 답글: list */}
      {Boolean(list.length) && (
        <ul className="mt-2 space-y-2">
          {list?.map((item) => {
            const { reComments: list, _count, ...itemData } = item;
            const childInfo = { depth: item.depth + 1, reCommentRefId: item.id, countReComments: _count?.reComments };
            const childrenWithProps = Children.map(children, (child, index) => {
              if (isValidElement(child)) {
                if (index === 0) return cloneElement(child as React.ReactElement<FeedbackCommentProps>, { item: itemData });
                if (index === 1) return cloneElement(child as React.ReactElement<CommentListProps>, { list, moreReComments, children, ...childInfo });
              }
              return child;
            });
            return (
              <li key={item.id}>
                <Comment item={itemData} />
                {childrenWithProps}
              </li>
            );
          })}
        </ul>
      )}
      {/* 답글: read more */}
      {list.length < countReComments && (
        <div className="mt-1">
          <span className="mt-1 mr-1 inline-block w-2 h-2 border-l border-b border-gray-400 align-top" />
          {page > 0 && list?.length < takeLength ? (
            <span className="text-sm text-gray-500">답글을 불러오고있어요</span>
          ) : (
            <button type="button" onClick={clickMore} disabled={list?.length < takeLength} className="text-sm text-gray-500">
              {page < 2 ? `답글 ${countReComments - list.length}개 보기` : `이전 답글 더보기`}
            </button>
          )}
        </div>
      )}
      {/* 답글: re-comment */}
      {user?.id !== -1 && isVisibleReCommentButton && (
        <div className="mt-1 -mr-2">
          <button type="button" className="flex items-center w-full text-left" onClick={clickComment}>
            <div className="grow shrink basis-auto min-w-0">
              <p className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-400 overflow-hidden whitespace-nowrap overflow-ellipsis">답글을 입력해주세요</p>
            </div>
            <div className="ml-2 flex-none flex items-center justify-center rounded-md w-10 h-10 text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"></path>
              </svg>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentList;
