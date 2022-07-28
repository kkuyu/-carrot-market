import { useRouter } from "next/router";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetStoriesCommentsResponse } from "@api/stories/[id]/comments";
import { GetCommentsDetailResponse } from "@api/comments/[id]";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";

export type FeedbackCommentItem = GetStoriesCommentsResponse["comments"][0] | GetCommentsDetailResponse["comment"];

export interface FeedbackCommentProps {
  item?: FeedbackCommentItem;
}

const FeedbackComment = ({ item }: FeedbackCommentProps) => {
  const router = useRouter();
  const isDetailPage = router.pathname === "/comments/[id]" && router?.query?.id?.toString() === item?.id.toString();

  const { user, currentAddr } = useUser();
  const { openModal } = useModal();

  const { data, error, mutate: boundMutate } = useSWR<GetCommentsDetailResponse>(item?.id ? `/api/comments/${item.id}` : null);
  const [updateLike, { loading: likeLoading }] = useMutation(item?.id ? `/api/comments/${item.id}/like` : "", {
    onSuccess: (data) => {
      boundMutate();
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  if (!item) return null;
  if (item.depth < StoryCommentMinimumDepth) null;
  if (item.depth > StoryCommentMaximumDepth) null;

  const likeRecords = data?.comment?.records?.filter((record) => record.kind === Kind.CommentLike) || [];
  const liked = likeRecords.find((record) => record.userId === user?.id);

  // toggle like
  const toggleLike = () => {
    if (!data) return;
    if (likeLoading) return;

    boundMutate((prev) => {
      let records = prev?.comment?.records ? [...prev.comment.records] : [];
      const idx = records.findIndex((record) => record.kind === Kind.CommentLike && record.userId === user?.id);
      const exists = idx !== -1;
      if (exists) records.splice(idx, 1);
      if (!exists) records.push({ id: 0, kind: Kind.CommentLike, userId: user?.id! });
      return prev && { ...prev, comment: { ...prev.comment, records: records } };
    }, false);
    updateLike({});
  };

  // click comment
  const commentClick = () => {
    if (isDetailPage) {
      const target = document.querySelector(".container input#comment") as HTMLInputElement;
      target?.focus();
    } else {
      router.push(`/comments/${item.id}`);
    }
  };

  // modal: sign up
  const openSignUpModal = () => {
    openModal<MessageModalProps>(MessageModal, "signUpNow", {
      type: "confirm",
      message: "휴대폰 인증하고 회원가입하시겠어요?",
      cancelBtn: "취소",
      confirmBtn: "회원가입",
      hasBackdrop: true,
      onConfirm: () => {
        router.push(`/join?addrNm=${currentAddr?.emdAddrNm}`);
      },
    });
  };

  return (
    <div className="space-x-2">
      {/* 좋아요: button */}
      <button type="button" onClick={() => (user?.id === -1 ? openSignUpModal() : toggleLike())}>
        <span className={`text-sm ${liked ? "text-orange-500" : "text-gray-500"}`}>좋아요 {likeRecords.length || null}</span>
      </button>
      {/* 댓글: button */}
      {item.depth < StoryCommentMaximumDepth && (
        <button type="button" onClick={commentClick}>
          <span className="text-sm text-gray-500">답글쓰기</span>
        </button>
      )}
    </div>
  );
};

export default FeedbackComment;
