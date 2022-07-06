import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
import { getDiffTimeStr } from "@libs/utils";

import { PageLayout } from "@libs/states";
import { GetPostDetailResponse } from "@api/posts/[id]";

import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import Buttons from "@components/buttons";
import { ThumbnailList, ThumbnailItem, CommentList } from "@components/lists";
import Profiles from "@components/profiles";
import { PostPostsCommentResponse } from "@api/posts/[id]/comment";
import Inputs from "@components/inputs";

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

  // static data: post detail
  const today = new Date();
  const thumbnails: ThumbnailItem[] = (staticProps?.post?.photo ? staticProps?.post.photo.split(",") : []).map((src, index, array) => ({
    src,
    index,
    key: `thumbnails-list-${index + 1}`,
    label: `${index + 1}/${array.length}`,
    name: `게시글 이미지 ${index + 1}/${array.length} (${staticProps?.post?.question?.length > 15 ? staticProps?.post?.question?.substring(0, 15) + "..." : staticProps?.post?.question})`,
  }));
  const [post, setPost] = useState<GetPostDetailResponse["post"] | null>(staticProps?.post ? staticProps.post : null);
  const [diffTime, setDiffTime] = useState(getDiffTimeStr(new Date(staticProps?.post.updatedAt).getTime(), today.getTime()));

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

  // click favorite
  const toggleCuriosity = () => {
    if (!post) return;
    if (curiosityLoading) return;
    boundMutate(
      (prev) =>
        prev && {
          ...prev,
          post: { ...prev.post, _count: { ...prev.post._count, curiosities: !prev.isCuriosity ? prev.post._count.curiosities + 1 : prev.post._count.curiosities - 1 } },
          isCuriosity: !prev.isCuriosity,
        },
      false
    );
    updateCuriosity({});
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
        router.replace(`/join?addrNm=${currentAddr?.emdAddrNm}`);
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
    setDiffTime(() => {
      return getDiffTimeStr(new Date(data?.post.updatedAt).getTime(), today.getTime());
    });
  }, [data]);

  // setting layout
  useEffect(() => {
    if (!post) {
      router.push("/");
      return;
    }

    setLayout(() => ({
      title: post?.question || "",
      seoTitle: `${post?.question || ""} | 게시글 상세`,
      header: {
        headerUtils: ["back", "share", "home"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  if (!post) {
    return null;
  }

  return (
    <article className="container pb-20">
      <h1 className="sr-only">{(post?.question || "")?.length > 15 ? post?.question?.substring(0, 15) + "..." : post?.question}</h1>

      {/* 게시글 정보 */}
      <section className="pt-5 block">
        {/* todo: 카테고리 */}
        <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">동네생활</em>

        {/* 판매자 */}
        <Profiles user={post?.user} emdPosNm={post?.emdPosNm} diffTime={diffTime} />

        {/* 설명 */}
        <p className="mt-5 block font-normal">{post?.question}</p>

        {/* 썸네일 */}
        {Boolean(thumbnails.length) && (
          <div className="mt-5">
            <ThumbnailList
              list={thumbnails || []}
              modal={{
                title: `게시글 이미지 (${post?.question?.length > 15 ? post?.question?.substring(0, 15) + "..." : post?.question})`,
              }}
            />
          </div>
        )}

        {/* 피드백 */}
        <div className="mt-5 border-t">
          <button type="button" className="py-2" onClick={user?.id === -1 ? openSignUpModal : toggleCuriosity}>
            <svg className={`inline-block w-5 h-5 ${data?.isCuriosity ? "text-orange-500" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className={`ml-1 text-sm ${data?.isCuriosity ? "text-orange-500" : "text-gray-500"}`}>궁금해요 {post?._count?.curiosities || null}</span>
          </button>
          <button type="button" className="ml-4 py-2" onClick={() => setFocus("comment")}>
            <svg className="inline-block w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
            <span className="ml-1 text-sm text-gray-500">댓글 {post?.comments?.length || null}</span>
          </button>
        </div>
      </section>

      {/* 댓글 입력 */}
      <div className="fixed bottom-0 left-0 w-full z-[50]">
        <div className="relative mx-auto flex items-center w-full h-16 max-w-xl px-5 border-t bg-white">
          <form onSubmit={handleSubmit(user?.id === -1 ? openSignUpModal : submitComment)} noValidate className="w-full space-y-4">
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
        </div>
      </div>

      {/* 댓글 목록 */}
      {Boolean(post?.comments?.length) && (
        <div className="border-t">
          <CommentList list={post.comments || []} />
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

export const getStaticProps: GetStaticProps = async (context) => {
  const postId = context?.params?.id?.toString();

  // invalid params: postId
  if (!postId || isNaN(+postId)) {
    return {
      props: {},
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
    },
  });

  // not found post
  if (!post) {
    return {
      props: {},
    };
  }

  // initial props
  return {
    props: {
      staticProps: {
        post: JSON.parse(JSON.stringify(post)),
      },
    },
  };
};

export default CommunityDetail;
