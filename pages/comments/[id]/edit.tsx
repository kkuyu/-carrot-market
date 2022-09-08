import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import { getCommentCondition } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";
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

  // fetch data
  const { data: commentData, mutate: mutateComment } = useSWR<GetCommentsDetailResponse>(router?.query?.id ? `/api/comments/${router.query.id}?includeReComments=true&` : null);

  // mutation data
  const [editComment, { loading: loadingComment }] = useMutation<PostCommentsUpdateResponse>(`/api/comments/${router.query.id}/update`, {
    onSuccess: async (data) => {
      await mutateComment();
      router.replace(`/comments/${data.comment.id}`);
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

  useEffect(() => {
    if (!commentData?.comment) return;
    formData.setValue("content", commentData?.comment?.content);
  }, [commentData]);

  return (
    <div className="container pt-5 pb-5">
      <EditStoryComment formId="edit-comment" formData={formData} onValid={submitStoryComment} isLoading={loadingComment} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getCommentsDetail: { response: GetCommentsDetailResponse };
}> = ({ getUser, getCommentsDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/comments/${getCommentsDetail.response.comment.id}`]: getCommentsDetail.response,
        },
      }}
    >
      <CommentsEditPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // commentId
  const commentId: string = params?.id?.toString() || "";

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
  const { comment, commentCondition } =
    commentId && !isNaN(+commentId)
      ? await getCommentsDetail({
          id: +commentId,
          userId: ssrUser?.profile?.id,
        })
      : {
          comment: null,
          commentCondition: null,
        };
  if (!comment || comment.depth < StoryCommentMinimumDepth || comment.depth > StoryCommentMaximumDepth) {
    return {
      redirect: {
        permanent: false,
        destination: `/comments/${commentId}`,
      },
    };
  }

  // redirect `/stories/${storyId}`
  if (commentCondition?.role?.myRole !== "author") {
    return {
      redirect: {
        permanent: false,
        destination: `/comments/${commentId}`,
      },
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
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
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
});

export default Page;
