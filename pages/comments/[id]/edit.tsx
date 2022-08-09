import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetCommentsDetailResponse } from "@api/comments/[id]";
import { PostCommentsUpdateResponse } from "@api/comments/[id]/update";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditComment, { EditCommentTypes } from "@components/forms/editComment";

const CommentsEditPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const { data: commentData, mutate } = useSWR<GetCommentsDetailResponse>(router?.query?.id ? `/api/comments/${router.query.id}` : null);

  const formData = useForm<EditCommentTypes>();
  const [editComment, { loading }] = useMutation<PostCommentsUpdateResponse>(`/api/comments/${router.query.id}/update`, {
    onSuccess: async (data) => {
      await mutate((prev) => prev && { ...prev, comment: { ...prev?.comment } });
      router.replace(`/comments/${data.comment.id}`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const submitUploadComment = async ({ ...data }: EditCommentTypes) => {
    if (!user || loading) return;
    editComment({ ...data });
  };

  useEffect(() => {
    if (!commentData?.comment) return;
    if (commentData.comment.userId !== user?.id) {
      router.push(`/comments/${router.query.id}`);
      return;
    }
    formData.setValue("content", commentData?.comment?.content);
  }, [commentData, user?.id]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <EditComment type="edit" formId="edit-comment" formData={formData} onValid={submitUploadComment} isLoading={loading} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getComment: { response: GetCommentsDetailResponse };
}> = ({ getUser, getComment }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/comments/${getComment.response.comment.id}`]: getComment.response,
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
  const ssrUser = await getSsrUser(req);

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

  // invalidUrl
  let invalidUrl = false;
  if (!commentId || isNaN(+commentId)) invalidUrl = true;
  // redirect `/comments/${commentId}`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/comments/${commentId}`,
      },
    };
  }

  // getComment
  const comment = await client.storyComment.findUnique({
    where: {
      id: +commentId,
    },
  });

  // invalidComment
  let invalidComment = false;
  if (!comment) invalidComment = true;
  if (comment?.userId !== ssrUser?.profile?.id) invalidComment = true;
  // redirect `/comments/${commentId}`
  if (invalidComment) {
    return {
      redirect: {
        permanent: false,
        destination: `/comments/${commentId}`,
      },
    };
  }

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
      getComment: {
        response: {
          success: true,
          comment: JSON.parse(JSON.stringify(comment || {})),
        },
      },
    },
  };
});

export default Page;
