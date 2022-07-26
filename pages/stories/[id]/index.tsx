import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
import { getStoryCategory, getDiffTimeStr } from "@libs/utils";
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { GetStoriesDetailResponse } from "@api/stories/[id]";
import { PostStoriesCommentResponse } from "@api/stories/[id]/comment";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import PictureList, { PictureListItem } from "@components/groups/pictureList";
import FeedbackStory, { FeedbackStoryItem } from "@components/groups/feedbackStory";
import CommentList from "@components/lists/commentList";
import Profiles from "@components/profiles";
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";

interface CommentForm {
  comment: string;
}

const StoryDetail: NextPage<{
  staticProps: {
    story: GetStoriesDetailResponse["story"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();
  const { openModal } = useModal();

  // view model
  const [mounted, setMounted] = useState(false);
  const [viewModel, setViewModel] = useState({
    mode: !user?.id ? "preview" : user?.id !== staticProps?.story?.userId ? "public" : "private",
  });

  // static data: story detail
  const today = new Date();
  const diffTime = getDiffTimeStr(new Date(staticProps?.story?.createdAt).getTime(), today.getTime());
  const category = getStoryCategory(staticProps?.story?.category);
  const [story, setStory] = useState<GetStoriesDetailResponse["story"] | null>(staticProps?.story ? staticProps.story : null);

  const shortContent = !story?.content ? "" : story.content.length <= 15 ? story.content : story.content.substring(0, 15) + "...";
  const thumbnails: PictureListItem[] = !story?.photos
    ? []
    : story.photos.split(",").map((src, index, array) => ({
        src,
        index,
        key: `thumbnails-slider-${index + 1}`,
        label: `${index + 1}/${array.length}`,
        name: `게시글 이미지 ${index + 1}/${array.length} (${shortContent})`,
      }));

  // fetch data: story detail
  const { data, error, mutate: boundMutate } = useSWR<GetStoriesDetailResponse>(router.query.id ? `/api/stories/${router.query.id}` : null);

  // new comment
  const { register, handleSubmit, setFocus, setValue } = useForm<CommentForm>();
  const [sendComment, { data: commentData, loading: commentLoading }] = useMutation<PostStoriesCommentResponse>(`/api/stories/${router.query.id}/comment`, {
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
  const [deleteStory, { loading: deleteLoading }] = useMutation(`/api/stories/${router.query.id}/delete`, {
    onSuccess: () => {
      router.replace("/stories");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

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
    openModal<MessageModalProps>(MessageModal, "confirmDeleteStory", {
      type: "confirm",
      message: "게시글을 정말 삭제하시겠어요?",
      cancelBtn: "취소",
      confirmBtn: "삭제",
      hasBackdrop: true,
      onConfirm: () => {
        if (deleteLoading) return;
        deleteStory({});
      },
    });
  };

  // merge data
  useEffect(() => {
    if (!data) return;
    if (!data.success) return;
    setStory((prev) => ({
      ...prev,
      ...data.story,
    }));
  }, [data]);

  // setting layout
  useEffect(() => {
    if (!story) return;

    const mode = !user?.id ? "preview" : user?.id !== story?.userId ? "public" : "private";
    setViewModel({ mode });

    setLayout(() => ({
      title: story?.content || "",
      seoTitle: `${story?.content || ""} | 게시글 상세`,
      header: {
        headerUtils: ["back", "home", "share", "kebab"],
        kebabActions:
          mode === "preview"
            ? [{ key: "welcome", text: "당근마켓 시작하기", onClick: () => router.push(`/welcome`) }]
            : mode === "public"
            ? [
                { key: "report", text: "신고" },
                { key: "block", text: "이 사용자의 글 보지 않기" },
              ]
            : mode === "private"
            ? [
                { key: "edit", text: "수정", onClick: () => router.push(`/stories/${story?.id}/edit`) },
                { key: "delete", text: "삭제", onClick: () => openDeleteModal() },
              ]
            : [],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, [user?.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!story) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className="container pb-20">
      {/* 게시글 정보 */}
      <section className="-mx-5 border-b">
        {/* 제목 */}
        <h1 className="sr-only">{shortContent}</h1>
        {/* 내용 */}
        <div className="pt-5 pb-4 px-5">
          {/* 카테고리 */}
          <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{category?.text}</em>
          {/* 판매자 */}
          <Link href={`/users/profiles/${story?.user?.id}`}>
            <a className="block py-3">
              <Profiles user={story?.user} emdPosNm={story?.emdPosNm} diffTime={mounted && diffTime ? diffTime : ""} />
            </a>
          </Link>
          {/* 게시글 내용 */}
          <div className="pt-5 border-t">
            <p className="whitespace-pre-wrap">{story?.content}</p>
          </div>
        </div>
        {/* 썸네일 */}
        {Boolean(thumbnails.length) && (
          <div className="pb-5 px-5">
            <PictureList list={thumbnails || []} />
          </div>
        )}
        {/* 피드백 */}
        {(viewModel.mode === "public" || viewModel.mode === "private") && <FeedbackStory item={story} />}
      </section>

      {/* 댓글 목록: list */}
      {Boolean(story?.comments) && Boolean(story?.comments?.length) && (
        <div className="mt-5">
          <CommentList list={story.comments} />
        </div>
      )}

      {/* 댓글 목록: empty */}
      {Boolean(story?.comments) && !Boolean(story?.comments?.length) && (
        <div className="pt-10 pb-5 text-center">
          <p className="text-gray-500">
            아직 댓글이 없어요.
            <br />
            가장 먼저 댓글을 남겨보세요.
          </p>
        </div>
      )}

      {/* 댓글 입력 */}
      {(viewModel.mode === "public" || viewModel.mode === "private") && (
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
  const storyId = params?.id?.toString();

  // invalid params: storyId
  // redirect: stories
  if (!storyId || isNaN(+storyId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories`,
      },
    };
  }

  // find story
  const story = await client.story.findUnique({
    where: {
      id: +storyId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      records: {
        where: {
          kind: Kind.StoryLike,
        },
        select: {
          id: true,
          kind: true,
          emotion: true,
          userId: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  // not found story
  // 404
  if (!story) {
    return {
      notFound: true,
    };
  }

  // initial props
  return {
    props: {
      staticProps: {
        story: JSON.parse(JSON.stringify(story || {})),
      },
    },
  };
};

export default StoryDetail;
