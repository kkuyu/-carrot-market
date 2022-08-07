import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetCommentsDetailResponse } from "@api/comments/[id]";
import { PostCommentsUpdateResponse } from "@api/comments/[id]/update";
// @pages
import type { NextPageWithLayout } from "@pages/_app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditComment, { EditCommentTypes } from "@components/forms/editComment";

const CommentEdit: NextPage = () => {
  const router = useRouter();
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
    if (loading) return;
    editComment({ ...data });
  };

  useEffect(() => {
    if (!commentData?.comment) return;
    formData.setValue("content", commentData?.comment?.content);
  }, [commentData?.comment]);

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
  getComment: { response: GetCommentsDetailResponse };
}> = ({ getComment }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`/api/comments/${getComment.response.comment.id}`]: getComment.response,
        },
      }}
    >
      <CommentEdit />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // redirect: welcome
  if (!ssrUser.profile && !ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/welcome`,
      },
    };
  }

  const commentId = params?.id?.toString() || "";

  // !ssrUser.profile
  // invalid params: commentId
  // redirect: comments/[id]
  if (!ssrUser.profile || !commentId || isNaN(+commentId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/comments/${commentId}`,
      },
    };
  }

  // find comment
  const comment = await client.storyComment.findUnique({
    where: {
      id: +commentId,
    },
  });

  // invalid comment: not found
  // redirect: comments/[id]
  if (!comment) {
    return {
      redirect: {
        permanent: false,
        destination: `/comments/${commentId}`,
      },
    };
  }

  // invalid comment: not my comment
  // redirect: stories/[id]
  if (comment.userId !== ssrUser?.profile?.id) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories/${commentId}`,
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
      getComment: {
        response: {
          success: true,
          comment: JSON.parse(JSON.stringify(comment || [])),
        },
      },
    },
  };
});

export default Page;
