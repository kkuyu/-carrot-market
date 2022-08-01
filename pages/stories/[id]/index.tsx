import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useMemo, useState } from "react";
import { useSetRecoilState } from "recoil";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
import { getStoryCategory, getDiffTimeStr, getCommentTree } from "@libs/utils";
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";
import { GetStoriesDetailResponse } from "@api/stories/[id]";
import { GetStoriesCommentsResponse, PostStoriesCommentsResponse } from "@api/stories/[id]/comments";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import PictureList, { PictureListItem } from "@components/groups/pictureList";
import FeedbackStory, { FeedbackStoryItem } from "@components/groups/feedbackStory";
import FeedbackComment from "@components/groups/feedbackComment";
import PostComment, { PostCommentTypes } from "@components/forms/postComment";
import CommentList from "@components/lists/commentList";
import Profiles from "@components/profiles";

const StoryDetail: NextPage<{
  staticProps: {
    story: GetStoriesDetailResponse["story"];
    comments: GetStoriesCommentsResponse["comments"];
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
  const { data, error } = useSWR<GetStoriesDetailResponse>(router.query.id ? `/api/stories/${router.query.id}` : null);

  // fetch data: story comments
  const [comments, setComments] = useState<GetStoriesCommentsResponse["comments"]>(staticProps?.comments ? staticProps.comments : []);
  const [commentsQuery, setCommentsQuery] = useState("");
  const { data: commentData, mutate: boundMutate } = useSWR<GetStoriesCommentsResponse>(mounted && router.query.id ? `/api/stories/${router.query.id}/comments?${commentsQuery}` : null);
  const treeComments = useMemo(() => {
    if (!comments?.length) return [];
    return getCommentTree(Math.max(...comments.map((v) => v.depth)), [...comments.map((v) => ({ ...v, reComments: [] }))]);
  }, [comments]);

  // new comment
  const formData = useForm<PostCommentTypes>({ defaultValues: { reCommentRefId: null } });
  const [sendComment, { loading: commentLoading }] = useMutation<PostStoriesCommentsResponse>(`/api/stories/${router.query.id}/comments`, {
    onSuccess: () => {
      formData.setValue("comment", "");
      setCommentsQuery(() => `exists=${JSON.stringify(comments.map((comment) => comment.id))}`);
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

  const moreReComments = (page: number, reCommentRefId: number, cursorId: number) => {
    const existComments = page !== 0 ? comments : comments.filter((comment) => comment.reCommentRefId !== reCommentRefId);
    setComments(() => [...existComments]);
    setCommentsQuery(() => `exists=${JSON.stringify(existComments?.map((comment) => comment.id))}&page=${page}&reCommentRefId=${reCommentRefId}${cursorId !== -1 ? `&cursorId=${cursorId}` : ""}`);
  };

  const submitReComment = (data: PostCommentTypes) => {
    if (!data) return;
    if (commentLoading) return;
    sendComment({ ...data, ...currentAddr });
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
    setStory((prev) => ({ ...prev, ...data.story }));
  }, [data]);

  // merge comment data
  useEffect(() => {
    if (!commentData) return;
    if (!commentData?.success) return;
    setComments(() => [...commentData.comments]);
  }, [commentData]);

  useEffect(() => {
    if (router?.query?.id?.toString() === story?.id?.toString()) return;
    setCommentsQuery(() => "");
  }, [router?.query?.id, story?.id]);

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
                { key: "report", text: "신고", onClick: () => console.log("신고") },
                { key: "block", text: "이 사용자의 글 보지 않기", onClick: () => console.log("이 사용자의 글 보지 않기") },
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
  }, [user?.id, story?.userId]);

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
        {(viewModel.mode === "public" || viewModel.mode === "private") && <FeedbackStory item={story} commentCount={commentData?.total} />}
      </section>

      {/* 댓글/답변 목록: list */}
      {treeComments && Boolean(treeComments?.length) && (
        <div className="mt-5">
          <CommentList list={treeComments} moreReComments={moreReComments}>
            <FeedbackComment />
            <CommentList />
          </CommentList>
        </div>
      )}

      {/* 댓글/답변 목록: empty */}
      {treeComments && !Boolean(treeComments?.length) && (
        <div className="pt-10 pb-5 text-center">
          <p className="text-gray-500">
            아직 {category?.commentType}이 없어요.
            <br />
            가장 먼저 {category?.commentType}을 남겨보세요.
          </p>
        </div>
      )}

      {/* 댓글/답변 입력 */}
      {(viewModel.mode === "public" || viewModel.mode === "private") && (
        <div className="fixed-container bottom-0 z-[50]">
          <div className="fixed-inner flex items-center h-16 border-t bg-white">
            <PostComment
              formData={formData}
              onValid={user?.id === -1 ? openSignUpModal : submitReComment}
              isLoading={commentLoading}
              commentType={category?.commentType}
              className="w-full pl-5 pr-3"
            />
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
  const storyId = params?.id?.toString();

  // invalid params: storyId
  // 404
  if (!storyId || isNaN(+storyId)) {
    return {
      notFound: true,
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
    },
  });

  // not found story
  // 404
  if (!story) {
    return {
      notFound: true,
    };
  }

  const comments = await client.storyComment.findMany({
    where: {
      storyId: story.id,
      depth: StoryCommentMinimumDepth,
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
      reComments: {
        take: 2,
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
      },
    },
  });

  // initial props
  return {
    props: {
      staticProps: {
        story: JSON.parse(JSON.stringify(story || {})),
        comments: JSON.parse(JSON.stringify(comments.map(({ reComments, ...o }) => o).concat(comments.flatMap((o) => o.reComments)) || {})),
      },
    },
  };
};

export default StoryDetail;
