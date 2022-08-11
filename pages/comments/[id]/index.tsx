import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import NextError from "next/error";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import { getCommentTree, truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth, StoryCommentReadType } from "@api/stories/types";
import { GetCommentsDetailResponse } from "@api/comments/[id]";
import { PostStoriesCommentsResponse } from "@api/stories/[id]/comments";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import RegisterModal, { RegisterModalProps, RegisterModalName } from "@components/commons/modals/case/registerModal";
import Comment from "@components/cards/comment";
import CommentTreeList from "@components/lists/commentTreeList";
import FeedbackComment from "@components/groups/feedbackComment";
import HandleComment from "@components/groups/handleComment";
import EditComment, { EditCommentTypes } from "@components/forms/editComment";
import StorySummary from "@components/cards/storySummary";
import Link from "next/link";

const CommentsDetailPage: NextPage = () => {
  const router = useRouter();
  const { user, currentAddr, type: userType } = useUser();
  const { changeLayout } = useLayouts();
  const { openModal } = useModal();

  // fetch data: comment detail
  const [commentQuery, setCommentQuery] = useState("");
  const { data: commentData, mutate: mutateCommentDetail } = useSWR<GetCommentsDetailResponse>(router?.query?.id ? `/api/comments/${router.query.id}?includeReComments=true&${commentQuery}` : null);

  const [commentFlatList, setCommentFlatList] = useState<GetCommentsDetailResponse["comment"][]>(() => {
    if (!commentData?.comment) return [];
    return [{ ...commentData?.comment, reComments: [] }, ...(commentData?.comment?.reComments || [])];
  });
  const commentLoading = useMemo(() => {
    if (!commentFlatList?.length) return false;
    return !!commentFlatList.find((comment) => comment.id === 0);
  }, [commentFlatList]);
  const commentTreeList = useMemo(() => {
    if (!commentFlatList?.length) return [];
    return getCommentTree(Math.max(...commentFlatList.map((v) => v.depth)), [...commentFlatList.map((v) => ({ ...v, reComments: [] }))]);
  }, [commentFlatList]);

  // new comment
  const formData = useForm<EditCommentTypes>();
  const [sendComment, { loading: sendCommentLoading }] = useMutation<PostStoriesCommentsResponse>(`/api/stories/${commentData?.comment?.storyId}/comments`, {
    onSuccess: () => {
      mutateCommentDetail();
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const moreReComments = (readType: StoryCommentReadType, reCommentRefId: number, prevCursor: number) => {
    const commentExistedList = readType === "more" ? commentFlatList : commentFlatList.filter((comment) => comment.reCommentRefId !== reCommentRefId);
    setCommentFlatList(() => [...commentExistedList]);
    setCommentQuery(() => {
      let result = "";
      result += `existed=${JSON.stringify(commentExistedList?.map((comment) => comment.id))}`;
      result += `&readType=${readType}&reCommentRefId=${reCommentRefId}&prevCursor=${prevCursor}`;
      return result;
    });
  };

  const validReComment = (data: EditCommentTypes) => {
    if (userType === "member") {
      submitReComment(data);
      return;
    }
    openModal<RegisterModalProps>(RegisterModal, RegisterModalName, {});
  };

  const submitReComment = (data: EditCommentTypes) => {
    if (!user || commentLoading || sendCommentLoading) return;
    if (!commentData?.comment) return;
    mutateCommentDetail((prev) => {
      const time = new Date();
      const { content, reCommentRefId = null } = data;
      const dummyAddr = { emdAddrNm: "", emdPosNm: "", emdPosDx: 0, emdPosX: 0, emdPosY: 0 };
      const dummyComment = { id: 0, depth: commentData?.comment?.depth + 1, content, reCommentRefId, userId: user?.id, storyId: commentData?.comment?.storyId, createdAt: time, updatedAt: time };
      return prev && { ...prev, comment: { ...prev.comment, reComments: [...(prev?.comment?.reComments || []), { ...dummyComment, user, ...dummyAddr }] } };
    }, false);
    formData?.setValue("content", "");
    sendComment({ ...data, ...currentAddr });
  };

  // merge comment data
  useEffect(() => {
    if (!commentData) return;
    setCommentFlatList(() => {
      if (!commentData?.comment) return [];
      return [{ ...commentData?.comment, reComments: [] }, ...(commentData?.comment?.reComments || [])];
    });
  }, [commentData]);

  useEffect(() => {
    if (!router?.query?.id) return;
    setCommentQuery(() => "");
    if (!user?.id) return;
    formData?.setValue("reCommentRefId", +router.query.id.toString());
    formData?.setFocus("content");
  }, [router?.query?.id, user?.id]);

  // setting layout
  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  if (!commentTreeList.length) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className={`container ${user?.id ? "pb-16" : "pb-5"}`}>
      <h1 className="sr-only">{truncateStr(commentTreeList?.[0]?.content, 15)} | 댓글</h1>

      {commentTreeList?.[0]?.story && (
        <Link href={`/stories/${commentTreeList?.[0].story.id}`}>
          <a className="block -mx-5 px-5 py-3 bg-gray-200">
            <StorySummary item={commentTreeList?.[0]?.story} />
          </a>
        </Link>
      )}

      <div className="relative mt-5">
        <Comment item={commentTreeList?.[0]} className={user?.id ? "pr-8" : ""} />
        <FeedbackComment item={commentTreeList?.[0]} />
        {user?.id && <HandleComment item={commentTreeList?.[0]} mutateCommentDetail={mutateCommentDetail} />}
      </div>

      {/* 답글 목록: list */}
      {Boolean(commentTreeList?.[0]?.reComments?.length) && (
        <div className="mt-2">
          <CommentTreeList list={commentTreeList?.[0]?.reComments} moreReComments={moreReComments} depth={commentTreeList?.[0]?.depth + 1}>
            <FeedbackComment key="FeedbackComment" />
            {user?.id && <HandleComment key="HandleComment" mutateCommentDetail={mutateCommentDetail} />}
            <CommentTreeList key="CommentTreeList" />
          </CommentTreeList>
        </div>
      )}

      {/* 답글 입력 */}
      {user?.id && (
        <div className="fixed bottom-0 left-0 w-full z-[50]">
          <div className="relative flex items-center mx-auto w-full h-14 max-w-screen-sm border-t bg-white">
            <EditComment formData={formData} onValid={validReComment} isLoading={commentLoading || sendCommentLoading} commentType="답글" className="w-full px-5" />
          </div>
        </div>
      )}
    </article>
  );
};

const Page: NextPageWithLayout<{
  getComment: { query: string; response: GetCommentsDetailResponse };
}> = ({ getComment }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`/api/comments/${getComment.response.comment.id}?${getComment.query}`]: getComment.response,
        },
      }}
    >
      <CommentsDetailPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const commentId: string = params?.id?.toString() || "";

  // invalidUrl
  let invalidUrl = false;
  if (!commentId || isNaN(+commentId)) invalidUrl = true;
  // 404
  if (invalidUrl) {
    return {
      notFound: true,
    };
  }

  // getComment
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
  const comments = comment
    ? await client.storyComment.findMany({
        where: {
          storyId: comment?.story.id,
          ...(comment?.depth ? { depth: comment?.depth + 1 } : {}),
          AND: { depth: { gte: StoryCommentMinimumDepth, lte: StoryCommentMaximumDepth } },
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
              category: true,
            },
          },
          _count: {
            select: {
              reComments: true,
            },
          },
        },
      })
    : [];

  // invalidComment
  let invalidComment = false;
  if (!comment) invalidComment = true;
  if (comment?.depth && comment.depth < StoryCommentMinimumDepth) invalidComment = true;
  if (comment?.depth && comment.depth > StoryCommentMaximumDepth) invalidComment = true;
  // 404
  if (invalidComment) {
    return {
      notFound: true,
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${truncateStr(comment?.content, 15)} | 댓글`,
    },
    header: {
      title: "댓글",
      titleTag: "strong",
      utils: ["back", "title"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getComment: {
        query: "includeReComments=true&",
        response: {
          success: true,
          comment: JSON.parse(JSON.stringify({ ...comment, reComments: comments } || {})),
        },
      },
    },
  };
};

export default Page;
