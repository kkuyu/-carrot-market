import { useRouter } from "next/router";
import { Children, cloneElement, isValidElement, useState } from "react";
// @libs
import useUser from "@libs/client/useUser";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { CommentsMoreInfo } from "@api/stories/[id]/comments";
// @components
import Comment, { CommentItem } from "@components/cards/comment";
import Images from "@components/images";

interface CommentListProps {
  list?: CommentItem[];
  reCommentRef?: CommentItem;
  currentMoreInfo?: CommentsMoreInfo;
  updateMoreInfo?: (moreInfo: CommentsMoreInfo) => void;
  children?: React.ReactNode;
}

const CommentList = ({ list, reCommentRef, currentMoreInfo, updateMoreInfo, children }: CommentListProps) => {
  const router = useRouter();
  const { user } = useUser();

  const [page, setPage] = useState(1);
  const isLoading = currentMoreInfo?.isLoading && currentMoreInfo.reCommentRefId === reCommentRef?.id;
  const isDetailPage = router.pathname === "/comments/[id]";
  const isVisibleReCommentButton = isDetailPage
    ? list?.[0]?.reCommentRefId?.toString() !== router?.query?.id?.toString()
    : user?.id !== -1 && list && list?.[0]?.depth >= StoryCommentMinimumDepth + 1 && list?.[0]?.depth <= StoryCommentMaximumDepth;

  const clickMore = () => {
    if (!updateMoreInfo) return;
    if (currentMoreInfo?.isLoading) return;
    const newPage = page + 1;
    setPage(newPage);
    updateMoreInfo({ reCommentRefId: reCommentRef?.id!, page: newPage, isLoading: true });
  };

  // click comment
  const clickComment = () => {
    router.push(`/comments/${reCommentRef?.id}`);
  };

  if (!list) return null;
  if (!list.length) return null;
  if (list?.[0].depth < StoryCommentMinimumDepth) return null;
  if (list?.[0].depth > StoryCommentMaximumDepth) return null;

  return (
    <div className={`${list?.[0].depth !== 0 ? "pl-11" : ""}`}>
      <ul className="space-y-2">
        {list?.map((item) => {
          const childrenWithProps = Children.map(children, (child, index) => {
            if (isValidElement(child)) {
              const { reComments, ...itemData } = item;
              return cloneElement(child as React.ReactElement<CommentListProps>, {
                list: reComments,
                reCommentRef: itemData,
                currentMoreInfo: currentMoreInfo,
                updateMoreInfo: updateMoreInfo,
                children: children,
              });
            }
            return child;
          });
          return (
            <li key={item.id} className="space-y-2">
              <Comment item={item} />
              {childrenWithProps}
            </li>
          );
        })}
      </ul>
      {reCommentRef && reCommentRef?._count && reCommentRef?._count?.reComments > list.length && (
        <div className="before:mt-1 before:mr-1 before:inline-block before:w-2 before:h-2 before:border-l before:border-b before:border-gray-400 before:align-top">
          {isLoading ? (
            <span className="text-sm text-gray-500">답글을 불러오고있어요</span>
          ) : (
            <button type="button" onClick={clickMore} disabled={isLoading} className="text-sm text-gray-500">
              {page === 1 ? `답글 ${reCommentRef?._count?.reComments - list.length}개 보기` : `이전 답글 더보기`}
            </button>
          )}
        </div>
      )}
      {isVisibleReCommentButton && (
        <div className="mt-2 -mr-2">
          <button type="button" className="flex items-center w-full text-left" onClick={clickComment}>
            <div className="flex-none">
              <Images size="2.25rem" cloudId={user?.avatar} alt="" />
            </div>
            <div className="ml-2 grow">
              <p className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-400">답글을 입력해주세요</p>
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
