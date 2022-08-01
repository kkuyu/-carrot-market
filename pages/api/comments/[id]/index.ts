import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record, User, StoryComment, Story } from "@prisma/client";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export type StoryCommentItem = StoryComment & {
  user: Pick<User, "id" | "name" | "avatar">;
  story?: (Pick<Story, "id" | "userId" | "category"> & Partial<Story>) & { user?: Pick<User, "id" | "name" | "avatar"> };
  records?: Pick<Record, "id" | "kind" | "userId">[];
  _count?: { reComments: number };
  reComments?: StoryCommentItem[];
};

export interface GetCommentsDetailResponse {
  success: boolean;
  comment: StoryCommentItem;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id, includeReComments: _includeReComments, exists: _exists, page: _page, reCommentRefId: _reCommentRefId, cursorId: _cursorId } = req.query;

    // request valid
    if (!_id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // find comment detail
    const id = +_id.toString();
    const includeReComments = _includeReComments ? JSON.parse(_includeReComments.toString()) : false;
    const comment = await client.storyComment.findUnique({
      where: {
        id,
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
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
    if (!comment) {
      const error = new Error("NotFoundComment");
      error.name = "NotFoundComment";
      throw error;
    }
    if (comment.depth < StoryCommentMinimumDepth) {
      const error = new Error("NotFoundComment");
      error.name = "NotFoundComment";
      throw error;
    }
    if (comment.depth > StoryCommentMaximumDepth) {
      const error = new Error("NotFoundComment");
      error.name = "NotFoundComment";
      throw error;
    }
    // result
    if (!includeReComments) {
      const result: GetCommentsDetailResponse = {
        success: true,
        comment,
      };
      return res.status(200).json(result);
    }

    const exists = _exists ? JSON.parse(_exists?.toString()).map((id: number) => ({ id })) : [];
    const page = _page ? +_page?.toString() : null;
    const reCommentRefId = _reCommentRefId ? +_reCommentRefId?.toString() : null;
    const cursorId = _cursorId ? +_cursorId?.toString() : null;

    const existComments = await client.storyComment.findMany({
      where: {
        storyId: comment.storyId,
        OR: [...exists],
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

    const pageComments = !(page !== null && reCommentRefId)
      ? []
      : await client.storyComment.findMany({
          skip: cursorId ? 1 : 0,
          ...(cursorId && { cursor: { id: cursorId } }),
          ...(!cursorId && page > 1 ? {} : { take: page === 0 ? 0 : page === 1 ? 2 : 10 }),
          where: {
            storyId: comment.storyId,
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

    const defaultComments =
      page !== null && reCommentRefId
        ? []
        : await client.storyComment.findMany({
            where: {
              storyId: comment.storyId,
              reCommentRefId: comment.id,
              depth: comment.depth + 1,
              NOT: [...exists],
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
                where: {
                  NOT: [...exists],
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
              },
            },
          });

    // result
    const result: GetCommentsDetailResponse = {
      success: true,
      comment: {
        ...comment,
        reComments: existComments.concat(
          pageComments,
          defaultComments.map(({ reComments, ...o }) => o),
          defaultComments.flatMap((o) => o.reComments)
        ),
      },
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

export default withSessionRoute(
  withHandler({
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
