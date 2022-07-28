import { useRouter } from "next/router";
import { Children, cloneElement, isValidElement } from "react";
import { useForm } from "react-hook-form";
import { mutate } from "swr";
// @libs
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { PostStoriesCommentsResponse } from "@api/stories/[id]/comments";
// @components
import Comment, { CommentItem } from "@components/cards/comment";
import Images from "@components/images";
import PostComment, { PostCommentTypes } from "@components/forms/postComment";

interface CommentListProps {
  list?: CommentItem[];
  children?: React.ReactNode;
}

const CommentList = ({ list, children }: CommentListProps) => {
  const router = useRouter();
  const { user, currentAddr } = useUser();

  const formData = useForm<PostCommentTypes>({ defaultValues: { reCommentRefId: list?.[0]?.reCommentRefId } });
  const isDetailPage = router.pathname === "/comments/[id]";
  const isVisibleForm =
    user?.id !== -1 &&
    list &&
    list?.[0]?.depth >= StoryCommentMinimumDepth + 1 &&
    list?.[0]?.depth <= StoryCommentMaximumDepth &&
    list?.[0]?.reCommentRefId?.toString() !== router?.query?.id?.toString();

  const [sendComment, { loading: commentLoading }] = useMutation<PostStoriesCommentsResponse>(`/api/stories/${list?.[0]?.storyId}/comments`, {
    onSuccess: () => {
      formData.setValue("comment", "");
      if (isDetailPage) mutate(`/api/comments/${router?.query?.id}?includeReComments=true`);
      if (!isDetailPage) mutate(`/api/stories/${list?.[0].storyId}/comments`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const submitReComment = (data: PostCommentTypes) => {
    if (commentLoading) return;
    sendComment({
      ...data,
      ...currentAddr,
    });
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
              return cloneElement(child as React.ReactElement<CommentListProps>, { list: item.reComments, children: children });
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
      {isVisibleForm && (
        <div className="flex items-center mt-2 -mr-2">
          <Images size="2.25rem" cloudId={user?.avatar} alt="" />
          <PostComment formData={formData} onValid={submitReComment} isLoading={false} className="grow pl-2" />
        </div>
      )}
    </div>
  );
};

export default CommentList;
