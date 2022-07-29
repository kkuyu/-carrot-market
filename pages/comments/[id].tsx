import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import NextError from "next/error";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import useSWR from "swr";
// @libs
import { PageLayout } from "@libs/states";
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
import { GetCommentsDetailResponse, StoryCommentItem } from "@api/comments/[id]";
import { PostStoriesCommentsResponse } from "@api/stories/[id]/comments";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import Comment from "@components/cards/comment";
import CommentList from "@components/lists/commentList";
import PostComment, { PostCommentTypes } from "@components/forms/postComment";

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
  const [viewModel, setViewModel] = useState({
    mode: !user?.id ? "preview" : user?.id !== staticProps?.comment?.userId ? "public" : "private",
  });

  // static data: comment detail
  const [comment, setComment] = useState<GetCommentsDetailResponse["comment"] | null>(staticProps?.comment ? staticProps.comment : null);

  // fetch data: comment detail
  const { data, error, mutate: boundMutate } = useSWR<GetCommentsDetailResponse>(router.query.id && comment ? `/api/comments/${router.query.id}?reCommentFilter=ALL` : null);

  // new comment
  const formData = useForm<PostCommentTypes>({ defaultValues: { reCommentRefId: comment?.id } });
  const [sendComment, { loading: commentLoading }] = useMutation<PostStoriesCommentsResponse>(`/api/stories/${comment?.storyId}/comments`, {
    onSuccess: (data) => {
      console.log(data);
      formData.setValue("comment", "");
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

  const submitComment = (data: PostCommentTypes) => {
    if (!data) return;
    if (commentLoading) return;
    sendComment({
      ...data,
      ...currentAddr,
    });
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
    const target = document.querySelector(".container input#comment") as HTMLInputElement;
    target?.focus();
  }, []);

  if (!comment) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className="container pt-5 pb-20">
      <Comment item={comment} />
      {/* 답글 목록: list */}
      {Boolean(comment?.reComments?.length) && (
        <div className="mt-2">
          <CommentList list={comment.reComments}>
            <CommentList />
          </CommentList>
        </div>
      )}
      {/* 답글 입력 */}
      {(viewModel.mode === "public" || viewModel.mode === "private") && (
        <div className="fixed bottom-0 left-0 w-full z-[50]">
          <div className="relative flex items-center mx-auto w-full h-16 max-w-xl border-t bg-white">
            <PostComment formData={formData} onValid={user?.id === -1 ? openSignUpModal : submitComment} isLoading={commentLoading} commentType="답글" className="w-full pl-5 pr-3" />
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
    select: {
      id: true,
      depth: true,
      storyId: true,
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

  // find comment
  const makeCommentTree: (depth: number, arr: StoryCommentItem[]) => StoryCommentItem[] | StoryCommentItem[] = (depth, arr) => {
    if (depth === 0) return arr;
    if (depth === comment.depth) return arr;
    const copyArr = [...arr];
    for (let index = copyArr.length - 1; index >= 0; index--) {
      if (copyArr[index].depth !== depth) continue;
      if (copyArr[index].reCommentRefId === null) continue;
      const [current] = copyArr.splice(index, 1);
      const refIndex = copyArr.findIndex((item) => current.reCommentRefId === item.id);
      copyArr[refIndex]?.reComments?.unshift(current);
    }
    return makeCommentTree(depth - 1, copyArr);
  };
  const comments = await client.storyComment.findMany({
    where: {
      storyId: comment.storyId,
      depth: {
        gte: comment.depth,
        lte: StoryCommentMaximumDepth,
      },
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
      story: {
        select: {
          id: true,
          userId: true,
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
  const treeComments = comments.length
    ? makeCommentTree(
        Math.max(...comments.map((v) => v.depth)),
        comments.map((v) => ({ ...v, reComments: [] }))
      )
    : [];

  // initial props
  return {
    props: {
      staticProps: {
        comment: JSON.parse(JSON.stringify(treeComments.find((treeComment) => treeComment.id === comment.id) || {})),
      },
    },
  };
};

export default CommentsDetail;