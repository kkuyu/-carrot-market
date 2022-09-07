import { useRouter } from "next/router";
import Link from "next/link";
import type { HTMLAttributes, ReactElement } from "react";
import { memo } from "react";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import { getCommentCondition } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetStoriesCommentsResponse } from "@api/stories/[id]/comments";
import { GetCommentsDetailResponse } from "@api/comments/[id]";
import { PostCommentsLikeResponse } from "@api/comments/[id]/like";
// @components
import WelcomeAlertModal, { WelcomeAlertModalProps, WelcomeAlertModalName } from "@components/commons/modals/instance/welcomeAlertModal";
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
import Buttons from "@components/buttons";

export type FeedbackCommentItem = GetStoriesCommentsResponse["comments"][number] | GetCommentsDetailResponse["comment"];

export interface FeedbackCommentProps extends HTMLAttributes<HTMLDivElement> {
  item?: FeedbackCommentItem;
}

const FeedbackComment = (props: FeedbackCommentProps) => {
  const { item, className = "", ...restProps } = props;
  const router = useRouter();
  const { user, type: userType } = useUser();
  const { openModal } = useModal();

  // fetch data
  const { data: commentData, mutate: mutateComment } = useSWR<GetCommentsDetailResponse>(item?.id && typeof item?.updatedAt !== "object" ? `/api/comments/${item.id}` : null, {
    ...(item ? { fallbackData: { success: true, comment: item, commentCondition: getCommentCondition(item) } } : {}),
  });

  // mutation data
  const [updateCommentLike, { loading: loadingCommentLike }] = useMutation<PostCommentsLikeResponse>(commentData ? `/api/comments/${item?.id}/like` : "", {
    onSuccess: async () => {
      await mutateComment();
    },
  });

  // update: Kind.CommentLike.Record
  const toggleLike = () => {
    if (!commentData) return;
    if (loadingCommentLike) return;
    const currentCondition = commentData?.commentCondition ?? getCommentCondition(commentData?.comment!, user?.id);
    mutateComment((prev) => {
      let records = prev?.comment?.records ? [...prev.comment.records] : [];
      if (currentCondition?.isLike) records = records.filter((record) => !(record.kind === Kind.CommentLike && record.userId === user?.id));
      if (!currentCondition?.isLike) records = [...records, { id: 0, kind: Kind.CommentLike, userId: user?.id! }];
      return prev && { ...prev, comment: { ...prev.comment, records }, commentCondition: getCommentCondition({ ...commentData?.comment, records }, user?.id) };
    }, false);
    updateCommentLike({ like: !currentCondition?.isLike });
  };

  if (!item) return null;
  if (!item.content) return null;
  if (item.depth < StoryCommentMinimumDepth) return null;
  if (item.depth > StoryCommentMaximumDepth) return null;

  const CustomFeedbackButton = (buttonProps: { pathname?: string; children: string | ReactElement } & HTMLAttributes<HTMLButtonElement | HTMLAnchorElement>) => {
    const { pathname, onClick, className: buttonClassName = "", children, ...buttonRestProps } = buttonProps;
    if (!pathname) {
      return (
        <Buttons tag="button" type="button" sort="text-link" size="sm" status="unset" onClick={onClick} className={`${buttonClassName}`} {...buttonRestProps}>
          {children}
        </Buttons>
      );
    }
    return (
      <Link href={pathname} passHref>
        <Buttons tag="a" sort="text-link" size="sm" status="unset" className={`${buttonClassName}`} {...buttonRestProps}>
          {children}
        </Buttons>
      </Link>
    );
  };

  return (
    <div className={`pl-11 space-x-2 ${className}`} {...restProps}>
      <CustomFeedbackButton
        onClick={() => {
          if (userType === "member") toggleLike();
          if (userType === "non-member") openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {});
          if (userType === "guest") openModal<WelcomeAlertModalProps>(WelcomeAlertModal, WelcomeAlertModalName, {});
        }}
        className={`${commentData?.commentCondition?.isLike ? "text-orange-500" : "text-gray-500"}`}
      >
        {`좋아요 ${commentData?.commentCondition?.likes || ""}`}
      </CustomFeedbackButton>
      {item.depth >= StoryCommentMaximumDepth ? (
        <></>
      ) : router.pathname === "/comments/[id]" && router?.query?.id?.toString() === item?.id.toString() ? (
        <CustomFeedbackButton onClick={() => (document.querySelector(".container input#content") as HTMLInputElement)?.focus()} className="text-gray-500">
          답글쓰기
        </CustomFeedbackButton>
      ) : (
        <CustomFeedbackButton pathname={`/comments/${item?.id}`} className="text-gray-500">
          답글쓰기
        </CustomFeedbackButton>
      )}
    </div>
  );
};

export default memo(FeedbackComment, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.content !== next?.item?.content) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
