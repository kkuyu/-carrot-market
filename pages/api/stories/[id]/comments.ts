import { NextApiRequest, NextApiResponse } from "next";
import { StoryComment } from "@prisma/client";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { StoryCommentItem } from "@api/comments/[id]";

export interface GetStoriesCommentsResponse {
  success: boolean;
  total: number;
  comments: StoryCommentItem[];
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

export interface PostStoriesCommentsResponse {
  success: boolean;
  comment: StoryComment;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    try {
      const { id: _id, exists: _exists, page: _page, reCommentRefId: _reCommentRefId, cursorId: _cursorId } = req.query;
      const { user } = req.session;

      // request valid
      if (!_id) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // find story detail
      const id = +_id.toString();
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

      // comments count
      const total = await client.storyComment.count({
        where: {
          storyId: id,
          depth: {
            gte: StoryCommentMinimumDepth,
            lte: StoryCommentMaximumDepth,
          },
          NOT: [{ comment: "" }],
        },
      });

      // comments data
      let comments = [] as StoryCommentItem[];

      const defaultComments = await client.storyComment.findMany({
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
            skip: 0,
            take: !_exists ? 2 : 0,
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
      comments = comments.concat(
        defaultComments.map(({ reComments, ...o }) => o),
        defaultComments.flatMap((o) => o.reComments)
      );

      const exists: number[] = _exists ? JSON.parse(_exists?.toString()) : [];
      const existComments = await client.storyComment.findMany({
        where: {
          storyId: story.id,
          OR: exists.filter((id) => !comments.find((o) => o.id === id)).map((id) => ({ id })),
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
      comments = comments.concat(existComments);

      const page = _page ? +_page?.toString() : null;
      const reCommentRefId = _reCommentRefId ? +_reCommentRefId?.toString() : null;
      const cursorId = _cursorId ? +_cursorId?.toString() : null;
      const pageComments = !(page !== null && reCommentRefId)
        ? []
        : await client.storyComment.findMany({
            skip: cursorId ? 1 : 0,
            ...(cursorId && { cursor: { id: cursorId } }),
            ...(!cursorId && page > 1 ? {} : { take: page === 0 ? 0 : page === 1 ? 2 : 10 }),
            where: {
              storyId: story.id,
              reCommentRefId,
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
      comments = comments.concat(pageComments);

      // result
      const result: GetStoriesCommentsResponse = {
        success: true,
        total,
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
      const { comment, reCommentRefId: _reCommentRefId, emdAddrNm, emdPosNm, emdPosX, emdPosY } = req.body;

      // request valid
      if (!_id) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!comment) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!emdAddrNm || !emdPosNm || !emdPosX || !emdPosY) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // find story detail
      const id = +_id.toString();
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

      // find reCommentRefId
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

      // create comment
      const newComment = await client.storyComment.create({
        data: {
          comment,
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
