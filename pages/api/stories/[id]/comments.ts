import { NextApiRequest, NextApiResponse } from "next";
import { StoryComment } from "@prisma/client";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { StoryCommentItem } from "@api/comments/[id]";
import { CommentMinimumDepth, CommentMaximumDepth, CommentReadEnum } from "@api/comments/types";

export interface GetStoriesCommentsResponse extends ResponseDataType {
  comments: StoryCommentItem[];
}

export interface PostStoriesCommentsResponse extends ResponseDataType {
  comment: StoryComment;
}

export const getStoriesComments = async (query: { storyId: number; existed: number[]; readType: CommentReadEnum | null; reCommentRefId: number; prevCursor: number; pageSize: number }) => {
  const { storyId, existed, readType, reCommentRefId, prevCursor, pageSize } = query;

  // comment params
  let comments = [] as StoryCommentItem[];

  // comment search
  const include = {
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
  };

  // fetch comments: default
  const defaultComments = await client.storyComment.findMany({
    where: {
      storyId: storyId,
      depth: CommentMinimumDepth,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      ...include,
      reComments: {
        skip: 0,
        take: !existed.length ? 2 : 0,
        orderBy: {
          createdAt: "asc",
        },
        include,
      },
    },
  });
  comments = comments.concat(
    defaultComments.map(({ reComments, ...o }) => o),
    defaultComments.flatMap((o) => o.reComments)
  );

  // fetch comments: existed
  const existedComments = await client.storyComment.findMany({
    where: {
      storyId: storyId,
      OR: existed.filter((id) => !comments.find((o) => o.id === id)).map((id) => ({ id })),
    },
    orderBy: {
      createdAt: "asc",
    },
    include,
  });
  comments = comments.concat(existedComments);

  // fetch comments: more
  const moreComments = readType
    ? await client.storyComment.findMany({
        skip: prevCursor ? 1 : 0,
        ...(readType === "more" && { take: pageSize }),
        ...(prevCursor && { cursor: { id: prevCursor } }),
        where: {
          storyId: storyId,
          reCommentRefId,
          AND: [{ depth: { gte: CommentMinimumDepth, lte: CommentMaximumDepth } }],
        },
        orderBy: {
          createdAt: "asc",
        },
        include,
      })
    : [];
  comments = comments.concat(moreComments);

  return { comments };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  if (req.method === "GET") {
    try {
      const { id: _id, existed: _existed, readType: _readType, reCommentRefId: _reCommentRefId, prevCursor: _prevCursor } = req.query;

      // invalid
      if (!_id) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (_readType && !isInstance(_readType.toString(), CommentReadEnum)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // params
      const id = +_id.toString();
      if (isNaN(id)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // fetch data
      const story = await client.story.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });
      if (!story) {
        const error = new Error("NotFoundStory");
        error.name = "NotFoundStory";
        throw error;
      }

      const existed: number[] = _existed ? JSON.parse(_existed?.toString()) : [];
      const readType = _readType ? (_readType?.toString() as CommentReadEnum) : null;
      const reCommentRefId = _reCommentRefId ? +_reCommentRefId?.toString() : 0;
      const prevCursor = _prevCursor ? +_prevCursor?.toString() : 0;
      const pageSize = !readType || !reCommentRefId ? 0 : !prevCursor ? 2 : 10;
      if (isNaN(reCommentRefId) || isNaN(prevCursor)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      const { comments } = await getStoriesComments({ storyId: story.id, existed, readType, reCommentRefId, prevCursor, pageSize });

      // result
      const result: GetStoriesCommentsResponse = {
        success: true,
        comments,
      };
      return res.status(200).json(result);
    } catch (error: unknown) {
      // error
      if (error instanceof Error) {
        const date = Date.now().toString();
        return res.status(422).json({
          success: false,
          error: {
            timestamp: date,
            name: error.name,
            message: error.message,
          },
        });
      }
    }
  }
  if (req.method === "POST") {
    try {
      const { id: _id } = req.query;
      const { user } = req.session;
      const { content, reCommentRefId: _reCommentRefId, emdAddrNm, emdPosNm, emdPosX, emdPosY } = req.body;

      // invalid
      if (!_id) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!content) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!emdAddrNm || !emdPosNm || !emdPosX || !emdPosY) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // params
      const id = +_id.toString();
      if (isNaN(id)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // fetch data
      const story = await client.story.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          comments: {
            where: {
              depth: 0,
            },
            select: {
              id: true,
            },
          },
        },
      });
      if (!story) {
        const error = new Error("NotFoundStory");
        error.name = "NotFoundStory";
        throw error;
      }

      // fetch reCommentRefId
      const reCommentRefId = !!_reCommentRefId ? +_reCommentRefId.toString() : null;
      const reCommentRef = reCommentRefId
        ? await client.storyComment.findUnique({
            where: {
              id: reCommentRefId,
            },
            select: {
              id: true,
              depth: true,
              storyId: true,
              _count: {
                select: {
                  reComments: true,
                },
              },
            },
          })
        : null;
      if (reCommentRefId && !reCommentRef) {
        const error = new Error("NotFoundComment");
        error.name = "NotFoundComment";
        throw error;
      }
      if (reCommentRefId && story.id !== reCommentRef?.storyId) {
        const error = new Error("NotFoundComment");
        error.name = "NotFoundComment";
        throw error;
      }

      // create story comment
      const newComment = await client.storyComment.create({
        data: {
          content,
          emdAddrNm,
          emdPosNm,
          emdPosX,
          emdPosY,
          user: {
            connect: {
              id: user?.id,
            },
          },
          story: {
            connect: {
              id: story.id,
            },
          },
          ...(reCommentRef
            ? {
                depth: reCommentRef.depth + 1,
                reCommentRef: {
                  connect: {
                    id: reCommentRef.id,
                  },
                },
              }
            : {
                depth: 0,
              }),
        },
      });

      // result
      const result: PostStoriesCommentsResponse = {
        success: true,
        comment: newComment,
      };
      return res.status(200).json(result);
    } catch (error: unknown) {
      // error
      if (error instanceof Error) {
        const date = Date.now().toString();
        return res.status(422).json({
          success: false,
          error: {
            timestamp: date,
            name: error.name,
            message: error.message,
          },
        });
      }
    }
  }
}

export default withSessionRoute(
  withHandler({
    methods: [
      { type: "GET", isPrivate: false },
      { type: "POST", isPrivate: true },
    ],
    handler,
  })
);
