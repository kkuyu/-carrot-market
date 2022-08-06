import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import { getStoryCategory, getDiffTimeStr, getCommentTree, truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";
import { GetStoriesDetailResponse } from "@api/stories/[id]";
import { GetStoriesCommentsResponse, PostStoriesCommentsResponse } from "@api/stories/[id]/comments";
// @components
import CustomHead from "@components/custom/head";
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import PictureList, { PictureListItem } from "@components/groups/pictureList";
import FeedbackStory, { FeedbackStoryItem } from "@components/groups/feedbackStory";
import FeedbackComment from "@components/groups/feedbackComment";
import HandleComment from "@components/groups/handleComment";
import EditComment, { EditCommentTypes } from "@components/forms/editComment";
import CommentTreeList from "@components/lists/commentTreeList";
import Profiles from "@components/profiles";

const StoryDetail: NextPage<{
  staticProps: {
    story: GetStoriesDetailResponse["story"];
    comments: GetStoriesCommentsResponse["comments"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const { user, currentAddr } = useUser();
  const { changeLayout } = useLayouts();
  const { openModal } = useModal();

  // view model
  const [mounted, setMounted] = useState(false);

  // static data: story detail
  const today = new Date();
  const diffTime = getDiffTimeStr(new Date(staticProps?.story?.createdAt).getTime(), today.getTime());
  const category = getStoryCategory(staticProps?.story?.category);
  const [story, setStory] = useState<GetStoriesDetailResponse["story"] | null>(staticProps?.story ? staticProps.story : null);
  const thumbnails: PictureListItem[] = !story?.photos
    ? []
    : story.photos.split(",").map((src, index, array) => ({
        src,
        index,
        key: `thumbnails-slider-${index + 1}`,
        label: `${index + 1}/${array.length}`,
        name: `게시글 이미지 ${index + 1}/${array.length} (${truncateStr(story.content, 15)})`,
      }));

  // fetch data: story detail
  const { data, mutate: mutateStoryDetail } = useSWR<GetStoriesDetailResponse>(router.query.id ? `/api/stories/${router.query.id}` : null);

  // fetch data: story comments
  const [comments, setComments] = useState<GetStoriesCommentsResponse["comments"]>(staticProps?.comments ? staticProps.comments : []);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsQuery, setCommentsQuery] = useState("");
  const { data: commentData, mutate: mutateStoryComments } = useSWR<GetStoriesCommentsResponse>(mounted && router.query.id ? `/api/stories/${router.query.id}/comments?${commentsQuery}` : null);
  const treeComments = useMemo(() => {
    if (!comments?.length) return [];
    return getCommentTree(Math.max(...comments.map((v) => v.depth)), [...comments.map((v) => ({ ...v, reComments: [] }))]);
  }, [comments]);

  // new comment
  const formData = useForm<EditCommentTypes>({ defaultValues: { reCommentRefId: null } });
  const [sendComment, { loading: sendCommentLoading }] = useMutation<PostStoriesCommentsResponse>(`/api/stories/${router.query.id}/comments`, {
    onSuccess: () => {
      mutateStoryDetail();
      mutateStoryComments();
      setCommentLoading(() => false);
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
    setCommentsQuery(() => {
      let result = "";
      result += `exists=${JSON.stringify(existComments?.map((comment) => comment.id))}`;
      result += `&page=${page}&reCommentRefId=${reCommentRefId}`;
      result += cursorId !== -1 ? `&cursorId=${cursorId}` : "";
      return result;
    });
  };

  const submitReComment = (data: EditCommentTypes) => {
    if (commentLoading || sendCommentLoading) return;
    if (!user) return;
    if (!story) return;
    setCommentLoading(() => true);
    mutateStoryDetail((prev) => {
      return prev && { ...prev, story: { ...prev.story, comments: [...prev.story.comments, { id: 0 }] } };
    }, false);
    mutateStoryComments((prev) => {
      const time = new Date();
      const { content, reCommentRefId = null } = data;
      const dummyAddr = { emdAddrNm: "", emdPosNm: "", emdPosDx: 0, emdPosX: 0, emdPosY: 0 };
      const dummyComment = { ...data, id: 0, depth: 0, content, reCommentRefId, userId: user?.id, storyId: story?.id, createdAt: time, updatedAt: time };
      return prev && { ...prev, total: prev.total + 1, comments: [...prev.comments, { ...dummyComment, user, ...dummyAddr }] };
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
    if (router?.query?.id === story?.id?.toString()) return;
    setCommentsQuery(() => "");
  }, [router?.query?.id, story?.id]);

  // setting layout
  useEffect(() => {
    if (!story) return;

    changeLayout({
      header: {
        title: "",
        titleTag: "strong",
        utils: ["back", 'title', "home", "share", "kebab"],
        kebabActions: (() => {
          if (!user?.id) {
            return [{ key: "welcome", text: "당근마켓 시작하기", onClick: () => router.push(`/welcome`) }];
          }
          if (user?.id !== staticProps?.story?.userId) {
            return [
              { key: "report", text: "신고", onClick: () => console.log("신고") },
              { key: "block", text: "이 사용자의 글 보지 않기", onClick: () => console.log("이 사용자의 글 보지 않기") },
            ];
          }
          return [
            { key: "edit", text: "수정", onClick: () => router.push(`/stories/${story?.id}/edit`) },
            { key: "delete", text: "삭제", onClick: () => openDeleteModal() },
          ];
        })(),
      },
      navBar: {
        utils: [],
      },
    });
  }, [user?.id, story?.id, story?.userId, story?.content]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!story) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className={`container ${user?.id ? "pb-20" : "pb-5"}`}>
      <CustomHead title={`${truncateStr(story?.content, 15)} | 동네생활`} />
      <h1 className="sr-only">{truncateStr(story.content, 15)} | 동네생활</h1>

      {/* 게시글 정보 */}
      <section className="-mx-5 border-b">
        {/* 내용 */}
        <div className="pt-5 pb-4 px-5">
          {/* 카테고리 */}
          <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{category?.text}</em>
          {/* 판매자 */}
          <Link href={`/profiles/${story?.user?.id}`}>
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
        <FeedbackStory item={story} />
      </section>

      {/* 댓글/답변 목록: list */}
      {treeComments && Boolean(treeComments?.length) && (
        <div className="mt-5">
          <CommentTreeList list={treeComments} moreReComments={moreReComments}>
            <FeedbackComment key="FeedbackComment" />
            {user?.id && <HandleComment key="HandleComment" mutateStoryDetail={mutateStoryDetail} mutateStoryComments={mutateStoryComments} className="p-1" />}
            <CommentTreeList key="CommentTreeList" />
          </CommentTreeList>
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
      {user?.id && (
        <div className="fixed-container bottom-0 z-[50]">
          <div className="fixed-inner flex items-center h-16 border-t bg-white">
            <EditComment
              type="post"
              formData={formData}
              onValid={user?.id === -1 ? openSignUpModal : submitReComment}
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
