import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import NextError from "next/error";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import useSWR from "swr";
// @libs
import { PageLayout } from "@libs/states";
import { getCommentTree } from "@libs/utils";
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetCommentsDetailResponse } from "@api/comments/[id]";
import { PostStoriesCommentsResponse } from "@api/stories/[id]/comments";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import Comment from "@components/cards/comment";
import CommentList from "@components/lists/commentList";
import FeedbackComment from "@components/groups/feedbackComment";
import PostComment, { PostCommentTypes } from "@components/forms/postComment";
import StorySummary from "@components/cards/storySummary";
import Link from "next/link";

const CommentsDetail: NextPage<{
  staticProps: {
    comment: GetCommentsDetailResponse["comment"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();
  const { openModal } = useModal();

  // view model
  const [mounted, setMounted] = useState(false);
  const [viewModel, setViewModel] = useState({
    mode: !user?.id ? "preview" : user?.id !== staticProps?.comment?.userId ? "public" : "private",
  });

  // comment detail
  const [comment, setComment] = useState<GetCommentsDetailResponse["comment"] | null>(staticProps?.comment ? staticProps.comment : null);
  const treeReComments = useMemo(() => {
    if (!comment?.reComments?.length) return [];
    return getCommentTree(Math.max(...comment?.reComments.map((v) => v.depth)), [{ ...comment, reComments: [] }, ...comment?.reComments.map((v) => ({ ...v, reComments: [] }))]);
  }, [comment]);
  const [commentsQuery, setCommentsQuery] = useState("");
  const { data, mutate: boundMutate } = useSWR<GetCommentsDetailResponse>(mounted && router.query.id ? `/api/comments/${router.query.id}?includeReComments=true&${commentsQuery}` : null);

  // new comment
  const formData = useForm<PostCommentTypes>();
  const [sendComment, { loading: commentLoading }] = useMutation<PostStoriesCommentsResponse>(`/api/stories/${comment?.storyId}/comments`, {
    onSuccess: (data) => {
      formData.setValue("comment", "");
      setCommentsQuery(() => `exists=${JSON.stringify(comment?.reComments?.map((comment) => comment.id))}`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const moreReComments = (reCommentRefId: number, page: number) => {
    const existComments = page !== 0 ? comment?.reComments : comment?.reComments?.filter((comment) => comment.reCommentRefId !== reCommentRefId);
    setComment((prev) => prev && { ...prev, reComments: existComments?.length ? [...existComments] : [] });
    setCommentsQuery(() => `exists=${JSON.stringify(existComments?.map((comment) => comment.id))}&page=${page}&reCommentRefId=${reCommentRefId}`);
  };

  const submitReComment = (data: PostCommentTypes) => {
    if (!data) return;
    if (commentLoading) return;
    sendComment({ ...data, ...currentAddr });
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

  // merge data
  useEffect(() => {
    if (!data) return;
    if (!data.success) return;
    setComment((prev) => ({
      ...prev,
      ...data.comment,
    }));
  }, [data]);

  // setting layout
  useEffect(() => {
    if (!comment) return;

    const mode = !user?.id ? "preview" : user?.id !== comment?.userId ? "public" : "private";
    setViewModel({ mode });

    setLayout(() => ({
      title: "답글쓰기",
      header: {
        headerUtils: ["back", "title"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, [user?.id, comment?.userId]);

  // focus
  useEffect(() => {
    if (!comment) return;
    formData.setValue("reCommentRefId", comment.id);
    (document.querySelector(".container input#comment") as HTMLInputElement)?.focus();
  }, [comment?.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!comment) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className="container pb-20">
      {comment?.story && (
        <Link href={`/stories/${comment.story.id}`}>
          <a className="block -mx-5 px-5 py-3 bg-gray-200">
            <StorySummary item={comment?.story} />
          </a>
        </Link>
      )}
      <div className="mt-5">
        <Comment item={comment} />
        <FeedbackComment item={comment} />
      </div>
      {/* 답글 목록: list */}
      {Boolean(treeReComments?.[0]?.reComments?.length) && (
        <div className="mt-2">
          <CommentList list={treeReComments?.[0]?.reComments} moreReComments={moreReComments} depth={comment.depth + 1}>
            <FeedbackComment />
            <CommentList />
          </CommentList>
        </div>
      )}
      {/* 답글 입력 */}
      {(viewModel.mode === "public" || viewModel.mode === "private") && (
        <div className="fixed bottom-0 left-0 w-full z-[50]">
          <div className="relative flex items-center mx-auto w-full h-16 max-w-xl border-t bg-white">
            <PostComment formData={formData} onValid={user?.id === -1 ? openSignUpModal : submitReComment} isLoading={commentLoading} commentType="답글" className="w-full pl-5 pr-3" />
          </div>
        </div>
      )}
    </article>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const commentId = params?.id?.toString();

  // invalid params: commentId
  // redirect: /
  if (!commentId || isNaN(+commentId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // find comment
  const comment = await client.storyComment.findUnique({
    where: {
      id: +commentId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      story: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      records: {
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      _count: {
        select: {
          reComments: true,
        },
      },
    },
  });

  // not found comment
  // 404
  if (!comment) {
    return {
      notFound: true,
    };
  }
  if (comment.depth < StoryCommentMinimumDepth) {
    return {
      notFound: true,
    };
  }
  if (comment.depth > StoryCommentMaximumDepth) {
    return {
      notFound: true,
    };
  }

  const reComments = await client.storyComment.findMany({
    where: {
      reCommentRefId: comment.id,
      depth: comment.depth + 1,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          reComments: true,
        },
      },
    },
  });

  // initial props
  return {
    props: {
      staticProps: {
        comment: JSON.parse(JSON.stringify({ ...comment, reComments } || null)),
      },
    },
  };
};

export default CommentsDetail;
