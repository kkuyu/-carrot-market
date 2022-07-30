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
    const { id: _id, includeReComments: _includeReComments, exists: _exists, page: _page, reCommentRefId: _reCommentRefId } = req.query;

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
    const reComments = await client.storyComment.findMany({
      where: {
        ...(reCommentRefId && page !== null
          ? { OR: [...exists, { reCommentRefId, order: { lte: (page - 1) * 10 + 1 } }] }
          : { OR: [...exists, { storyId: comment.storyId, reCommentRefId: comment.id, depth: comment.depth + 1 }] }),
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
        _count: {
          select: {
            reComments: true,
          },
        },
      },
    });

    // result
    const result: GetCommentsDetailResponse = {
      success: true,
      comment: { ...comment, reComments },
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
