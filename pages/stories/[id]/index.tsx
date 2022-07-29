import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { useForm } from "react-hook-form";
import useSWR, { mutate } from "swr";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
import { getStoryCategory, getDiffTimeStr } from "@libs/utils";
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";
import { StoryCommentItem } from "@api/comments/[id]";
import { GetStoriesDetailResponse } from "@api/stories/[id]";
import { CommentsMoreInfo, GetStoriesCommentsResponse, PostStoriesCommentsResponse } from "@api/stories/[id]/comments";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import PictureList, { PictureListItem } from "@components/groups/pictureList";
import FeedbackStory, { FeedbackStoryItem } from "@components/groups/feedbackStory";
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
  const [comments, setComments] = useState<GetStoriesCommentsResponse["comments"]>(staticProps.comments);
  const [moreInfo, setMoreInfo] = useState<CommentsMoreInfo>(null);
  const [moreHistory, setMoreHistory] = useState<CommentsMoreInfo[]>([null]);
  const [moreLoading, setMoreLoading] = useState<boolean>(false);
  const { data: commentData, mutate: boundMutate } = useSWR<GetStoriesCommentsResponse>(
    mounted && router.query.id
      ? `/api/stories/${router.query.id}/comments?${moreInfo ? `reCommentRefId=${moreInfo.reCommentRefId}&page=${moreInfo.page}` : `moreHistory=${JSON.stringify(moreHistory)}`}`
      : null
  );

  // new comment
  const formData = useForm<PostCommentTypes>({ defaultValues: { reCommentRefId: null } });
  const [sendComment, { loading: commentLoading }] = useMutation<PostStoriesCommentsResponse>(`/api/stories/${router.query.id}/comments`, {
    onSuccess: () => {
      formData.setValue("comment", "");
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

  const updateMoreInfo = (moreInfo: CommentsMoreInfo) => {
    setMoreLoading(() => true);
    setMoreInfo(() => moreInfo);
  };

  const mergeComments: (
    data: { moreInfo: GetStoriesCommentsResponse["moreInfo"]; comments: GetStoriesCommentsResponse["comments"] },
    arr: GetStoriesCommentsResponse["comments"]
  ) => GetStoriesCommentsResponse["comments"] = ({ moreInfo, comments }, arr = []) => {
    if (!moreInfo || !comments) return arr;
    const index = arr.findIndex((v) => v.id === moreInfo?.reCommentRefId);
    if (index !== -1) {
      const { reComments: nextReComments = [] } = comments[0];
      const prevReComments = arr?.[index]?.reComments || [];
      const updateReComments = Array.from(new Set([...prevReComments, ...nextReComments]));
      arr[index] = { ...arr[index], reComments: updateReComments };
    }
    return arr.map((v) => ({
      ...v,
      reComments: mergeComments({ moreInfo, comments }, v?.reComments || []),
    }));
  };

  const makeDummyComment = (data: PostCommentTypes): GetStoriesCommentsResponse["comments"][0] => {
    const time = new Date();
    const commentData = { emdAddrNm: currentAddr?.emdAddrNm || "", emdPosNm: currentAddr?.emdPosNm || "", emdPosX: currentAddr?.emdPosX || 0, emdPosY: currentAddr?.emdPosY || 0 };
    const userData = { id: user?.id || 0, name: user?.name || "", avatar: user?.avatar || "" };
    const storyData = { id: story?.id || 0, userId: story?.userId || 0 };
    return {
      id: 0,
      depth: 0,
      comment: data.comment,
      reCommentRefId: null,
      createdAt: time,
      updatedAt: time,
      ...commentData,
      userId: userData.id,
      user: userData,
      storyId: storyData.id,
      story: storyData,
    };
  };

  const submitComment = (data: PostCommentTypes) => {
    if (!data) return;
    if (commentLoading) return;
    if (moreLoading) return;
    setMoreLoading(() => true);
    setMoreInfo(() => null);
    boundMutate((prev) => {
      const newComment = makeDummyComment(data);
      return prev && { ...prev, comments: [...prev.comments, newComment] };
    }, false);
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

  useEffect(() => {
    if (!commentData) return;
    if (!commentData?.success) return;
    if (moreHistory.find((history) => JSON.stringify(history) === JSON.stringify(commentData.moreInfo))) return;

    if (commentData.moreInfo) {
      setMoreInfo(() => commentData.moreInfo);
      setMoreHistory((prev) => [...prev, commentData.moreInfo]);
    }

    setComments((prev) => {
      const { moreInfo, comments, historyComments } = commentData;
      let result = !moreInfo ? [...comments] : mergeComments({ moreInfo, comments }, prev);
      for (let index = 0; index < historyComments.length; index++) {
        const { moreInfo, comments } = historyComments[index];
        result = mergeComments({ moreInfo, comments }, [...result]);
      }
      return result;
    });
    setMoreLoading(() => {
      console.log(commentData.comments[commentData.comments.length - 1].id === 0, commentData.comments[commentData.comments.length - 1].id);
      return commentData.comments[commentData.comments.length - 1].id === 0;
    });
  }, [commentData]);

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
      {comments && Boolean(comments?.length) && (
        <div className="mt-5">
          <CommentList list={comments} updateMoreInfo={updateMoreInfo} currentMoreInfo={moreInfo}>
            <CommentList />
          </CommentList>
        </div>
      )}

      {/* 댓글/답변 목록: empty */}
      {comments && !Boolean(comments?.length) && (
        <div className="pt-10 pb-5 text-center">
          <p className="text-gray-500">
            아직 {category?.isLikeWithEmotion ? "댓글" : "답변"}이 없어요.
            <br />
            가장 먼저 {category?.isLikeWithEmotion ? "댓글" : "답변"}을 남겨보세요.
          </p>
        </div>
      )}

      {/* 댓글 입력 */}
      {(viewModel.mode === "public" || viewModel.mode === "private") && (
        <div className="fixed bottom-0 left-0 w-full z-[50]">
          <div className="relative flex items-center mx-auto w-full h-16 max-w-xl border-t bg-white">
            <PostComment
              formData={formData}
              onValid={user?.id === -1 ? openSignUpModal : submitComment}
              isLoading={commentLoading || moreLoading}
              commentType={category?.isLikeWithEmotion ? "댓글" : "답변"}
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
      comments: {
        where: {
          depth: {
            gte: StoryCommentMinimumDepth,
            lte: StoryCommentMaximumDepth,
          },
        },
        select: {
          id: true,
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

  // find comment
  const makeCommentTree: (depth: number, arr: StoryCommentItem[]) => StoryCommentItem[] | StoryCommentItem[] = (depth, arr) => {
    if (depth === 0) return arr;
    const copyArr = [...arr];
    for (let index = copyArr.length - 1; index >= 0; index--) {
      if (copyArr[index].depth !== depth) continue;
      if (copyArr[index].reCommentRefId === null) continue;
      const [current] = copyArr.splice(index, 1);
      const refIndex = copyArr.findIndex((item) => current.reCommentRefId === item.id);
      copyArr[refIndex]?.reComments?.unshift(current);
      if ((copyArr[refIndex]?.reComments?.length || 0) > 2) copyArr[refIndex]?.reComments?.pop();
    }
    return makeCommentTree(depth - 1, copyArr);
  };
  const comments = await client.storyComment.findMany({
    where: {
      storyId: story.id,
      depth: {
        gte: StoryCommentMinimumDepth,
        lte: StoryCommentMaximumDepth,
      },
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
  const treeComments = comments.length
    ? makeCommentTree(
        Math.max(...comments.map((v) => v.depth)),
        comments.map((v) => ({ ...v, reComments: [] }))
      )
    : [];

  // initial props
  return {
    props: {
      staticProps: {
        story: JSON.parse(JSON.stringify(story || {})),
        comments: JSON.parse(JSON.stringify(treeComments || {})),
      },
    },
  };
};

export default StoryDetail;
