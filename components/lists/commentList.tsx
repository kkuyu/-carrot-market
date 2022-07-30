import { useRouter } from "next/router";
import { Children, cloneElement, isValidElement, useEffect, useState } from "react";
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
  const [moreInfo, setMoreInfo] = useState({ read: false, page });

  const takeLength = (() => {
    if (page === 0) return 0;
    if (page === -1) return list.length;
    if (!countReComments) return list.length;
    const result = (page - 1) * 10 + 1 + 1;
    return countReComments < result ? countReComments : result;
  })();
  const isVisibleReCommentButton = router.pathname === "/stories/[id]" && Boolean(list.length) && depth >= StoryCommentMinimumDepth + 1 && depth <= StoryCommentMaximumDepth;

  const updatePage = (page: number) => {
    if (!reCommentRefId) return;
    if (!moreReComments) return;
    setPage(page);
    moreReComments(reCommentRefId, page);
  };

  const clickComment = () => {
    router.push(`/comments/${reCommentRefId}`);
  };

  useEffect(() => {
    if (moreInfo.read) return;
    if (takeLength === countReComments) setMoreInfo({ read: true, page });
  }, [takeLength]);

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
      <div className="mt-1 empty:hidden before:mt-1 before:mr-1 before:inline-block before:w-2 before:h-2 before:border-l before:border-b before:border-gray-400 before:align-top">
        {list?.length < takeLength && page > 0 ? (
          <span className="text-sm text-gray-500">답글을 불러오고있어요</span>
        ) : list.length < countReComments ? (
          <button type="button" onClick={() => updatePage(moreInfo.read ? moreInfo.page : page + 1)} disabled={list?.length < takeLength} className="text-sm text-gray-500">
            {page < 2 ? `답글 ${countReComments - list.length}개 보기` : `이전 답글 더보기`}
          </button>
        ) : list?.length === countReComments && page > 1 ? (
          <button type="button" onClick={() => updatePage(0)} disabled={list?.length < takeLength} className="text-sm text-gray-500">
            답글 숨기기
          </button>
        ) : null}
      </div>
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
