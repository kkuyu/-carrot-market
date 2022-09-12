import type { NextPage } from "next";
import { useRouter } from "next/router";
import NextError from "next/error";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { CommentMaximumDepth, CommentMinimumDepth } from "@api/comments/types";
import { GetUserResponse, getUser } from "@api/user";
import { GetCommentsDetailResponse, getCommentsDetail, getCommentsReComments } from "@api/comments/[id]";
import { PostCommentsUpdateResponse } from "@api/comments/[id]/update";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditStoryComment, { EditStoryCommentTypes } from "@components/forms/editStoryComment";

const CommentsEditPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();

  // variable: invisible
  const [isValidComment, setIsValidComment] = useState(true);

  // fetch data
  const { data: commentData, mutate: mutateComment } = useSWR<GetCommentsDetailResponse>(router?.query?.id ? `/api/comments/${router.query.id}?includeReComments=true&` : null);

  // mutation data
  const [editComment, { loading: loadingComment }] = useMutation<PostCommentsUpdateResponse>(`/api/comments/${router.query.id}/update`, {
    onSuccess: async (data) => {
      await mutateComment();
      await router.replace(`/comments/${data.comment.id}`);
    },
  });

  // variable: visible
  const formData = useForm<EditStoryCommentTypes>({
    defaultValues: {
      content: commentData?.comment?.content,
    },
  });

  // update: StoryComment
  const submitStoryComment = async ({ ...data }: EditStoryCommentTypes) => {
    if (!user || loadingComment) return;
    editComment({ ...data });
  };

  // update: isValidComment
  useEffect(() => {
    if (loadingComment) return;
    const isInvalid = {
      user: !(commentData?.commentCondition?.role?.myRole === "author"),
    };
    // invalid
    if (!commentData?.success || !commentData?.comment || Object.values(isInvalid).includes(true)) {
      setIsValidComment(false);
      const commentId = router?.query?.id?.toString();
      let redirectDestination = null;
      router.replace(redirectDestination ?? `/comments/${commentId}`);
      return;
    }
    // valid
    setIsValidComment(true);
  }, [loadingComment, commentData]);

  // update: formData
  useEffect(() => {
    if (!commentData?.comment) return;
    formData.setValue("content", commentData?.comment?.content);
  }, [commentData?.comment]);

  if (!isValidComment) {
    return <NextError statusCode={500} />;
  }

  return (
    <div className="container pt-5 pb-5">
      <EditStoryComment formId="edit-comment" formData={formData} onValid={submitStoryComment} isLoading={loadingComment} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getCommentsDetail: { options: { url: string; query: string }; response: GetCommentsDetailResponse };
}> = ({ getUser, getCommentsDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [`${getCommentsDetail.options.url}?${getCommentsDetail.options.query}`]: getCommentsDetail.response,
        },
      }}
    >
      <CommentsEditPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // params
  const commentId = params?.id?.toString() || "";
  
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });


  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile) invalidUser = true;
  // redirect `/comments/${commentId}`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: `/comments/${commentId}`,
      },
    };
  }

  // getCommentsDetail
  const commentsDetail =
    commentId && !isNaN(+commentId)
      ? await getCommentsDetail({
          id: +commentId,
          userId: ssrUser?.profile?.id,
        })
      : {
          comment: null,
          commentCondition: null,
        };
  if (!commentsDetail?.comment || commentsDetail?.comment?.depth < CommentMinimumDepth || commentsDetail?.comment?.depth > CommentMaximumDepth) {
    return {
      redirect: {
        permanent: false,
        destination: `/comments/${commentId}`,
      },
    };
  }

  const isInvalid = {
    user: !(commentsDetail?.commentCondition?.role?.myRole === "author"),
  };

  // isInvalid
  // redirect: redirectDestination ?? `/comments/${commentId}`,
  if (Object.values(isInvalid).includes(true)) {
    let redirectDestination = null;
    return {
      redirect: {
        permanent: false,
        destination: redirectDestination ?? `/comments/${commentId}`,
      },
    };
  }

  // fetch data: comments
  const commentsReComments = await getCommentsReComments({
    existed: [],
    readType: null,
    reCommentRefId: 0,
    prevCursor: 0,
    commentDepth: commentsDetail?.comment.depth,
    storyId: commentsDetail?.comment.storyId,
  });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "댓글 수정 | 댓글",
    },
    header: {
      title: "댓글 수정",
      titleTag: "h1",
      utils: ["back", "title", "submit"],
      submitId: "edit-comment",
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getUser: {
        options: {
          url: "/api/user",
          query: "",
        },
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getCommentsDetail: {
        options: {
          url: `/api/comments/${commentsDetail?.comment?.id}`,
          query: "includeReComments=true&",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify({ ...commentsDetail, comment: { ...commentsDetail?.comment, reComments: commentsReComments?.comments } } || {})),
        },
      },
    },
  };
});

export default Page;
