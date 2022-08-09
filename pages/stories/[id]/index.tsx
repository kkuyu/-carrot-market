import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
import { Kind } from "@prisma/client";
// @libs
import { getStoryCategory, getDiffTimeStr, getCommentTree, truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth, StoryCommentReadType } from "@api/stories/types";
import { GetStoriesDetailResponse } from "@api/stories/[id]";
import { GetStoriesCommentsResponse, PostStoriesCommentsResponse } from "@api/stories/[id]/comments";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import PictureList from "@components/groups/pictureList";
import FeedbackStory from "@components/groups/feedbackStory";
import FeedbackComment from "@components/groups/feedbackComment";
import HandleComment from "@components/groups/handleComment";
import EditComment, { EditCommentTypes } from "@components/forms/editComment";
import CommentTreeList from "@components/lists/commentTreeList";
import Profiles from "@components/profiles";

const StoriesDetailPage: NextPage<{}> = () => {
  const router = useRouter();
  const { user, currentAddr, type: userType } = useUser();
  const { changeLayout } = useLayouts();
  const { openModal } = useModal();

  // fetch data: story detail
  const { data: storyData, mutate: mutateStoryDetail } = useSWR<GetStoriesDetailResponse>(router.query.id ? `/api/stories/${router.query.id}` : null);
  const [mounted, setMounted] = useState(false);
  const today = new Date();
  const diffTime = storyData?.story && getDiffTimeStr(new Date(storyData?.story?.createdAt).getTime(), today.getTime());
  const category = storyData?.story && getStoryCategory(storyData?.story?.category);

  // fetch data: story comments
  const [commentQuery, setCommentQuery] = useState("");
  const { data: commentData, mutate: mutateStoryComments } = useSWR<GetStoriesCommentsResponse>(router.query.id ? `/api/stories/${router.query.id}/comments?${commentQuery}` : null);

  const [commentFlatList, setCommentFlatList] = useState<GetStoriesCommentsResponse["comments"]>(commentData?.comments ? commentData?.comments : []);
  const commentLoading = useMemo(() => {
    if (!commentFlatList?.length) return false;
    return !!commentFlatList.find((comment) => comment.id === 0);
  }, [commentFlatList]);
  const commentTreeList = useMemo(() => {
    if (!commentFlatList?.length) return [];
    return getCommentTree(Math.max(...commentFlatList.map((v) => v.depth)), [...commentFlatList.map((v) => ({ ...v, reComments: [] }))]);
  }, [commentFlatList]);

  // new comment
  const formData = useForm<EditCommentTypes>({ defaultValues: { reCommentRefId: null } });
  const [sendComment, { loading: sendCommentLoading }] = useMutation<PostStoriesCommentsResponse>(`/api/stories/${router.query.id}/comments`, {
    onSuccess: () => {
      mutateStoryDetail();
      mutateStoryComments();
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

  const moreReComments = (readType: StoryCommentReadType, reCommentRefId: number, prevCursor: number) => {
    const commentExistedList = readType === "more" ? commentFlatList : commentFlatList.filter((comment) => comment.reCommentRefId !== reCommentRefId);
    setCommentFlatList(() => [...commentExistedList]);
    setCommentQuery(() => {
      let result = "";
      result += `existed=${JSON.stringify(commentExistedList?.map((comment) => comment.id))}`;
      result += `&readType=${readType}&reCommentRefId=${reCommentRefId}&prevCursor=${prevCursor}`;
      return result;
    });
  };

  const submitReComment = (data: EditCommentTypes) => {
    if (!user || userType !== "member") return;
    if (!storyData?.story) return;
    if (commentLoading || sendCommentLoading) return;
    mutateStoryDetail((prev) => {
      return prev && { ...prev, story: { ...prev.story, comments: [...prev.story.comments, { id: 0 }] } };
    }, false);
    mutateStoryComments((prev) => {
      const time = new Date();
      const { content, reCommentRefId = null } = data;
      const dummyAddr = { emdAddrNm: "", emdPosNm: "", emdPosDx: 0, emdPosX: 0, emdPosY: 0 };
      const dummyComment = { ...data, id: 0, depth: 0, content, reCommentRefId, userId: user?.id, storyId: storyData?.story?.id, createdAt: time, updatedAt: time };
      return prev && { ...prev, comments: [...prev.comments, { ...dummyComment, user, ...dummyAddr }] };
    }, false);
    formData.setValue("content", "");
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
        router.push("/user/account/phone");
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

  // merge comment data
  useEffect(() => {
    if (!commentData) return;
    if (!commentData?.success) return;
    setCommentFlatList(() => [...commentData.comments]);
  }, [commentData]);

  useEffect(() => {
    if (!router?.query?.id) return;
    setCommentQuery(() => "");
  }, [router?.query?.id]);

  // setting layout
  useEffect(() => {
    if (!userType) return;
    const kebabActions = [
      { key: "welcome", text: "당근마켓 시작하기", onClick: () => router.push(`/welcome`) },
      { key: "report", text: "신고", onClick: () => console.log("신고") },
      { key: "block", text: "이 사용자의 글 보지 않기", onClick: () => console.log("이 사용자의 글 보지 않기") },
      { key: "edit", text: "수정", onClick: () => router.push(`/stories/${storyData?.story?.id}/edit`) },
      { key: "delete", text: "삭제", onClick: () => openDeleteModal() },
    ];
    changeLayout({
      meta: {},
      header: {
        kebabActions:
          userType === "guest"
            ? kebabActions.filter((action) => ["welcome"].includes(action.key))
            : user?.id !== storyData?.story?.userId
            ? kebabActions.filter((action) => ["report", "block"].includes(action.key))
            : kebabActions.filter((action) => ["edit", "delete"].includes(action.key)),
      },
      navBar: {},
    });
  }, [storyData?.story, user?.id, userType]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!storyData?.story) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className={`container ${user?.id ? "pb-20" : "pb-5"}`}>
      <h1 className="sr-only">{truncateStr(storyData?.story?.content, 15)} | 동네생활</h1>

      {/* 게시글 정보 */}
      <section className="-mx-5 border-b">
        {/* 내용 */}
        <div className="pt-5 pb-4 px-5">
          {/* 카테고리 */}
          <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{category?.text}</em>
          {/* 판매자 */}
          <Link href={`/profiles/${storyData?.story?.user?.id}`}>
            <a className="block py-3">
              <Profiles user={storyData?.story?.user} emdPosNm={storyData?.story?.emdPosNm} diffTime={mounted && diffTime ? diffTime : ""} />
            </a>
          </Link>
          {/* 게시글 내용 */}
          <div className="pt-5 border-t">
            <p className="whitespace-pre-wrap">{storyData?.story?.content}</p>
          </div>
        </div>
        {/* 썸네일 */}
        {Boolean(storyData?.story?.photos?.length) && (
          <div className="pb-5 px-5">
            <PictureList
              list={
                storyData?.story?.photos?.split(",")?.map((src, index, array) => ({
                  src,
                  index,
                  key: `thumbnails-slider-${index + 1}`,
                  label: `${index + 1}/${array.length}`,
                  name: `게시글 이미지 ${index + 1}/${array.length} (${truncateStr(storyData?.story?.content, 15)})`,
                })) || []
              }
            />
          </div>
        )}
        {/* 피드백 */}
        <FeedbackStory item={storyData?.story} />
      </section>

      {/* 댓글/답변 목록: list */}
      {commentTreeList && Boolean(commentTreeList?.length) && (
        <div className="mt-5">
          <CommentTreeList list={commentTreeList} moreReComments={moreReComments}>
            <FeedbackComment key="FeedbackComment" />
            {user?.id && <HandleComment key="HandleComment" mutateStoryDetail={mutateStoryDetail} mutateStoryComments={mutateStoryComments} className="p-1" />}
            <CommentTreeList key="CommentTreeList" />
          </CommentTreeList>
        </div>
      )}

      {/* 댓글/답변 목록: empty */}
      {commentTreeList && !Boolean(commentTreeList?.length) && (
        <div className="pt-10 pb-5 text-center">
          <p className="text-gray-500">
            아직 {category?.commentType}이 없어요.
            <br />
            가장 먼저 {category?.commentType}을 남겨보세요.
          </p>
        </div>
      )}

      {/* 댓글/답변 입력 */}
      {user?.id && (
        <div className="fixed-container bottom-0 z-[50]">
          <div className="fixed-inner flex items-center h-16 border-t bg-white">
            <EditComment
              type="post"
              formData={formData}
              onValid={userType === "member" ? submitReComment : openSignUpModal}
              isLoading={commentLoading || sendCommentLoading}
              commentType={category?.commentType}
              className="w-full pl-5 pr-3"
            />
          </div>
        </div>
      )}
    </article>
  );
};

const Page: NextPageWithLayout<{
  getStory: { response: GetStoriesDetailResponse };
  getComments: { query: string; response: GetStoriesCommentsResponse };
}> = ({ getStory, getComments }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`/api/stories/${getStory.response.story.id}`]: getStory.response,
          [`/api/stories/${getStory.response.story.id}/comments?${getComments.query}`]: getComments.response,
        },
      }}
    >
      <StoriesDetailPage />
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
  // storyId
  const storyId: string = params?.id?.toString() || "";

  // invalidUrl
  let invalidUrl = false;
  if (!storyId || isNaN(+storyId)) invalidUrl = true;
  // 404
  if (invalidUrl) {
    return {
      notFound: true,
    };
  }

  // getStory
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

  // invalidStory
  let invalidStory = false;
  if (!story) invalidStory = true;
  // 404
  if (invalidStory) {
    return {
      notFound: true,
    };
  }

  // getComments
  const comments = await client.storyComment.findMany({
    where: {
      storyId: story?.id,
      depth: StoryCommentMinimumDepth,
      AND: { depth: { gte: StoryCommentMinimumDepth, lte: StoryCommentMaximumDepth } },
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
    },
  });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${truncateStr(story?.content, 15)} | 동네생활`,
    },
    header: {
      title: "",
      titleTag: "strong",
      utils: ["back", "title", "home", "share", "kebab"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getStory: {
        response: {
          success: true,
          story: JSON.parse(JSON.stringify(story || {})),
        },
      },
      getComments: {
        query: "",
        response: {
          success: true,
          comments: JSON.parse(JSON.stringify(comments || [])),
        },
      },
    },
  };
};

export default Page;
