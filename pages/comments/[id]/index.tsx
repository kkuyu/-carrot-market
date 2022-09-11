import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import { getCommentTree, truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
// @api
import { CommentMinimumDepth, CommentMaximumDepth } from "@api/comments/types";
import { GetCommentsDetailResponse, getCommentsDetail, getCommentsReComments } from "@api/comments/[id]";
import { PostStoriesCommentsResponse } from "@api/stories/[id]/comments";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
import Comment from "@components/cards/comment";
import CommentTreeList from "@components/lists/commentTreeList";
import FeedbackComment from "@components/groups/feedbackComment";
import HandleComment from "@components/groups/handleComment";
import EditStoryComment, { EditStoryCommentTypes } from "@components/forms/editStoryComment";
import StorySummary from "@components/cards/storySummary";

const CommentsDetailPage: NextPage = () => {
  const router = useRouter();
  const { user, currentAddr, type: userType } = useUser();
  const { openModal } = useModal();

  // variable: invisible
  const [commentQuery, setCommentQuery] = useState("");

  // fetch data
  const { data: commentData, mutate: mutateCommentDetail } = useSWR<GetCommentsDetailResponse>(router?.query?.id ? `/api/comments/${router.query.id}?includeReComments=true&${commentQuery}` : null);

  // mutation data
  const [updateComment, { loading: loadingComment }] = useMutation<PostStoriesCommentsResponse>(`/api/stories/${commentData?.comment?.storyId}/comments`, {
    onSuccess: async () => {
      mutateCommentDetail();
    },
  });

  // variable: visible
  const formData = useForm<EditStoryCommentTypes>();

  // variable: comments
  const [flatComments, setFlatComments] = useState<GetCommentsDetailResponse["comment"][]>(() => {
    if (!commentData?.comment) return [];
    return [{ ...commentData?.comment, reComments: [] }, ...(commentData?.comment?.reComments || [])];
  });
  const { comment, treeComments, loadingComments } = useMemo(() => {
    const [comment] = getCommentTree(Math.max(...flatComments.map((v) => v.depth)), [...flatComments.map((v) => ({ ...v, reComments: [] }))]);
    return { comment: { ...comment, reComments: [] }, treeComments: comment?.reComments || [], loadingComments: !!flatComments.find((comment) => comment.id === 0) };
  }, [flatComments]);

  // update: StoryComment
  const submitReComment = (data: EditStoryCommentTypes) => {
    if (!user || loadingComment || loadingComments) return;
    if (!commentData?.comment) return;
    mutateCommentDetail((prev) => {
      const time = new Date();
      const { content, reCommentRefId = null } = data;
      const dummyAddr = { emdAddrNm: "", emdPosNm: "", emdPosDx: 0, emdPosX: 0, emdPosY: 0 };
      const dummyComment = { id: 0, depth: commentData?.comment?.depth + 1, content, reCommentRefId, userId: user?.id, storyId: commentData?.comment?.storyId, createdAt: time, updatedAt: time };
      return prev && { ...prev, comment: { ...prev.comment, reComments: [...(prev?.comment?.reComments || []), { ...dummyComment, user, ...dummyAddr }] } };
    }, false);
    formData?.setValue("content", "");
    updateComment({ ...data, ...currentAddr });
  };

  useEffect(() => {
    setFlatComments((prev) => (commentData?.comment ? [{ ...commentData?.comment, reComments: [] }, ...(commentData?.comment?.reComments || [])] : prev));
  }, [commentData]);

  useEffect(() => {
    if (!router?.query?.id) return;
    setCommentQuery(() => "");
    formData?.setValue("reCommentRefId", +router.query.id.toString());
    if (userType !== "guest") formData?.setFocus("content");
  }, [router?.query?.id]);

  if (!commentData?.success || !comment) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className="">
      <h1 className="sr-only">{truncateStr(comment?.content, 15)} | 댓글</h1>

      {comment?.story && (
        <Link href={`/stories/${comment.story.id}`}>
          <a className="block px-5 py-3 bg-gray-200">
            <StorySummary item={comment?.story} />
          </a>
        </Link>
      )}

      <section className={`container pt-5 ${userType !== "guest" ? "pb-16" : "pb-5"}`}>
        <div className="relative">
          <Comment item={comment} className={userType === "member" ? "pr-8" : ""} />
          <FeedbackComment item={comment} />
          {userType === "member" && <HandleComment item={comment} mutateCommentDetail={mutateCommentDetail} />}
        </div>

        {/* 답글 목록: list */}
        {Boolean(treeComments?.length) && (
          <div className="mt-2">
            <CommentTreeList
              list={treeComments}
              depth={comment?.depth + 1}
              prefix={comment?.id?.toString()}
              cardProps={{ className: `${userType === "member" ? "pr-8" : ""}` }}
              moreReComments={(readType, reCommentRefId, prevCursor) => {
                const comments = readType === "more" ? flatComments : flatComments.filter((comment) => comment.reCommentRefId !== reCommentRefId);
                setFlatComments(() => [...comments]);
                setCommentQuery(() => {
                  let result = "";
                  result += `existed=${JSON.stringify(comments?.map((comment) => comment.id))}`;
                  result += `&readType=${readType}&reCommentRefId=${reCommentRefId}&prevCursor=${prevCursor}`;
                  return result;
                });
              }}
            >
              <FeedbackComment key="FeedbackComment" />
              {userType === "member" ? <HandleComment key="HandleComment" mutateCommentDetail={mutateCommentDetail} /> : <></>}
              <CommentTreeList key="CommentTreeList" />
            </CommentTreeList>
          </div>
        )}

        {/* 답글 입력 */}
        {userType !== "guest" && (
          <div className="fixed bottom-0 left-0 w-full z-[50]">
            <div className="relative flex items-center mx-auto w-full h-14 max-w-screen-sm border-t bg-white">
              <EditStoryComment
                formData={formData}
                onValid={(data) => (userType === "member" ? submitReComment(data) : openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {}))}
                isLoading={loadingComment || loadingComments}
                commentType="답글"
                className="w-full px-5"
              />
            </div>
          </div>
        )}
      </section>
    </article>
  );
};

const Page: NextPageWithLayout<{
  getCommentsDetail: { query: string; response: GetCommentsDetailResponse };
}> = ({ getCommentsDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          ...(getCommentsDetail ? { [`/api/comments/${getCommentsDetail.response.comment.id}?${getCommentsDetail.query}`]: getCommentsDetail.response } : {}),
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

  // getCommentsDetail
  const { comment, commentCondition } =
    commentId && !isNaN(+commentId)
      ? await getCommentsDetail({
          id: +commentId,
        })
      : {
          comment: null,
          commentCondition: null,
        };
  if (!comment || comment.depth < CommentMinimumDepth || comment.depth > CommentMaximumDepth) {
    return {
      notFound: true,
    };
  }

  // fetch data: comments
  const { comments } = await getCommentsReComments({
    existed: [],
    readType: null,
    reCommentRefId: 0,
    prevCursor: 0,
    pageSize: 0,
    commentDepth: comment.depth,
    storyId: comment.storyId,
  });

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
      getCommentsDetail: {
        query: "includeReComments=true&",
        response: {
          success: true,
          comment: JSON.parse(JSON.stringify({ ...comment, reComments: comments } || {})),
          commentCondition: JSON.parse(JSON.stringify(commentCondition || {})),
        },
      },
    },
  };
};

export default Page;
