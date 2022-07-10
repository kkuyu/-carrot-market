import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Error from "next/error";

import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { getCategory, getDiffTimeStr } from "@libs/utils";
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";

import { PageLayout } from "@libs/states";
import { GetPostDetailResponse } from "@api/posts/[id]";
import { PostPostsCommentResponse } from "@api/posts/[id]/comment";

import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import Profiles from "@components/profiles";
import ThumbnailList, { ThumbnailListItem } from "@components/groups/thumbnailList";
import Comment from "@components/cards/comment";
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";
import PostFeedback, { PostFeedbackItem } from "@components/groups/postFeedback";
import { FeelingKeys } from "@api/posts/types";
import { PostPostsCuriosityResponse } from "@api/posts/[id]/curiosity";
import { PostPostsEmotionResponse } from "@api/posts/[id]/emotion";

interface CommentForm {
  comment: string;
}

const CommunityDetail: NextPage<{
  staticProps: {
    post: GetPostDetailResponse["post"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();
  const { openModal } = useModal();

  // view model
  const [viewModel, setViewModel] = useState({
    mode: Boolean(user?.id) ? "normal" : "preview",
  });

  // static data: post detail
  const today = new Date();
  const [post, setPost] = useState<GetPostDetailResponse["post"] | null>(staticProps?.post ? staticProps.post : null);
  const diffTime = getDiffTimeStr(new Date(staticProps?.post.updatedAt).getTime(), today.getTime());
  const category = getCategory("post", staticProps?.post?.category);
  const cutDownContent = !staticProps?.post?.content ? "" : staticProps.post.content.length <= 15 ? staticProps.post.content : staticProps.post.content.substring(0, 15) + "...";
  const thumbnails: ThumbnailListItem[] = !staticProps?.post?.photo
    ? []
    : staticProps.post.photo.split(",").map((src, index, array) => ({
        src,
        index,
        key: `thumbnails-slider-${index + 1}`,
        label: `${index + 1}/${array.length}`,
        name: `게시글 이미지 ${index + 1}/${array.length} (${cutDownContent})`,
      }));

  // fetch data: post detail
  const { data, error, mutate: boundMutate } = useSWR<GetPostDetailResponse>(router.query.id ? `/api/posts/${router.query.id}` : null);
  const [updateCuriosity, { loading: curiosityLoading }] = useMutation(`/api/posts/${router.query.id}/curiosity`, {
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // new comment
  const { register, handleSubmit, setFocus, setValue } = useForm<CommentForm>();
  const [sendComment, { data: commentData, loading: commentLoading }] = useMutation<PostPostsCommentResponse>(`/api/posts/${router.query.id}/comment`, {
    onSuccess: () => {
      setValue("comment", "");
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

  // kebab action: delete
  const [deletePost, { loading: deleteLoading }] = useMutation(`/api/posts/${router.query.id}/delete`, {
    onSuccess: () => {
      router.replace("/community");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const curiosityItem = async (item: PostFeedbackItem) => {
    if (!data) return;
    const mutateData = {
      ...data,
      post: {
        ...data.post,
        curiosity: !data.post.curiosity,
        curiosities: {
          ...data.post.curiosities,
          count: data.post.curiosity ? data.post.curiosities.count - 1 : data.post.curiosities.count + 1,
        },
      },
    };
    boundMutate(mutateData, false);
    const updateCuriosity: PostPostsCuriosityResponse = await (await fetch(`/api/posts/${item.id}/curiosity`, { method: "POST" })).json();
    if (updateCuriosity.error) console.error(updateCuriosity.error);
    boundMutate();
  };

  const emotionItem = async (item: PostFeedbackItem, feeling: FeelingKeys) => {
    if (!data) return;
    const actionType = !data.post.emotion ? "create" : data.post.emotion !== feeling ? "update" : "delete";
    const mutateData = {
      ...data,
      post: {
        ...data.post,
        emotion: (() => {
          if (actionType === "create") return feeling;
          if (actionType === "update") return feeling;
          return null;
        })(),
        emotions: {
          ...data.post.emotions,
          count: (() => {
            if (actionType === "create") return data.post.emotions.count + 1;
            if (actionType === "update") return data.post.emotions.count;
            return data.post.emotions.count - 1;
          })(),
          feelings: (() => {
            if (data.post.emotions.count === 1) {
              if (actionType === "create") return [feeling];
              if (actionType === "update") return [feeling];
              return [];
            }
            if (actionType === "create") return data.post.emotions.feelings.includes(feeling) ? data.post.emotions.feelings : [...data.post.emotions.feelings, feeling];
            if (actionType === "update") return data.post.emotions.feelings.includes(feeling) ? data.post.emotions.feelings : [...data.post.emotions.feelings, feeling];
            return data.post.emotions.feelings;
          })(),
        },
      },
    };
    boundMutate(mutateData, false);
    const updateEmotion: PostPostsEmotionResponse = await (await fetch(`/api/posts/${item.id}/emotion?feeling=${feeling}`, { method: "POST" })).json();
    if (updateEmotion.error) console.error(updateEmotion.error);
    boundMutate();
  };

  const commentItem = (item: PostFeedbackItem) => {
    setFocus("comment");
  };

  const submitComment = (data: CommentForm) => {
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

  // modal: delete
  const openDeleteModal = () => {
    openModal<MessageModalProps>(MessageModal, "confirmDeletePost", {
      type: "confirm",
      message: "게시글을 정말 삭제하시겠어요?",
      cancelBtn: "취소",
      confirmBtn: "삭제",
      hasBackdrop: true,
      onConfirm: () => {
        if (deleteLoading) return;
        deletePost({});
      },
    });
  };

  // merge data
  useEffect(() => {
    if (!data) return;
    if (!data.success) return;
    setPost((prev) => ({
      ...prev,
      ...data.post,
    }));
  }, [data]);

  // setting layout
  useEffect(() => {
    if (!post) return;

    setViewModel({
      mode: Boolean(user?.id) ? "normal" : "preview",
    });

    setLayout(() => ({
      title: post?.content || "",
      seoTitle: `${post?.content || ""} | 게시글 상세`,
      header: {
        headerUtils: ["back", "home", "share", "kebab"],
        kebabActions: !user?.id
          ? [{ key: "welcome", text: "당근마켓 시작하기", onClick: () => router.push(`/welcome`) }]
          : user?.id === post?.userId
          ? [
              { key: "edit", text: "수정", onClick: () => router.push(`/community/${post?.id}/edit`) },
              { key: "delete", text: "삭제", onClick: () => openDeleteModal() },
            ]
          : [
              { key: "report", text: "신고" },
              { key: "block", text: "이 사용자의 글 보지 않기" },
            ],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, [user?.id]);

  if (!post) {
    return <Error statusCode={404} />;
  }

  return (
    <article className="container pb-20">
      {/* 게시글 정보 */}
      <section className="-mx-5 border-b">
        {/* 제목 */}
        <h1 className="sr-only">{cutDownContent}</h1>
        {/* 내용 */}
        <div className="pt-5 pb-4 px-5">
          {/* 카테고리 */}
          <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{category?.text}</em>
          {/* 판매자 */}
          <Profiles user={post?.user} emdPosNm={post?.emdPosNm} diffTime={diffTime} />
          {/* 게시글 내용 */}
          <p className="mt-5 block whitespace-pre-wrap">{post?.content}</p>
        </div>
        {/* 썸네일 */}
        {Boolean(thumbnails.length) && (
          <div className="pb-5 px-5">
            <ThumbnailList
              list={thumbnails || []}
              modal={{
                title: `게시글 이미지 (${cutDownContent})`,
              }}
            />
          </div>
        )}
        {/* 피드백 */}
        {viewModel.mode === "normal" && (
          <PostFeedback item={post} curiosityItem={user?.id === -1 ? openSignUpModal : curiosityItem} emotionItem={user?.id === -1 ? openSignUpModal : emotionItem} commentItem={commentItem} />
        )}
      </section>

      {/* 댓글 목록: list */}
      {Boolean(post?.comments) && Boolean(post?.comments?.length) && (
        <ul className="mt-5 space-y-3">
          {post.comments.map((item) => (
            <li key={item.id}>
              <Comment item={item} />
            </li>
          ))}
        </ul>
      )}

      {/* 댓글 목록: empty */}
      {Boolean(post?.comments) && !Boolean(post?.comments?.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">
            아직 댓글이 없어요.
            <br />
            가장 먼저 댓글을 남겨보세요.
          </p>
        </div>
      )}

      {/* 댓글 입력 */}
      {viewModel.mode === "normal" && Boolean(post?.comments) && (
        <form onSubmit={handleSubmit(user?.id === -1 ? openSignUpModal : submitComment)} noValidate className="mt-5 space-y-4">
          <div className="space-y-1">
            <Inputs
              register={register("comment", {
                required: true,
              })}
              name="comment"
              type="text"
              kind="text"
              placeholder="댓글을 입력해주세요"
              appendButtons={
                <Buttons
                  tag="button"
                  type="submit"
                  sort="icon-block"
                  status="default"
                  text={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"></path>
                    </svg>
                  }
                  aria-label="검색"
                />
              }
            />
          </div>
        </form>
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
  const postId = params?.id?.toString();

  // invalid params: postId
  // redirect: community
  if (!postId || isNaN(+postId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/community`,
      },
    };
  }

  // find post
  const post = await client.post.findUnique({
    where: {
      id: +postId,
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
          curiosities: true,
          emotions: true,
          comments: true,
        },
      },
    },
  });

  // not found post
  // 404
  if (!post) {
    return {
      notFound: true,
    };
  }

  // initial props
  return {
    props: {
      staticProps: {
        post: JSON.parse(JSON.stringify(post || {})),
      },
    },
  };
};

export default CommunityDetail;
