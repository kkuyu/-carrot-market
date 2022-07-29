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
  story: Pick<Story, "id" | "userId">;
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

type ReCommentFilter = "ALL" | "NONE" | "ONLY_CHILDREN";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id, reCommentFilter: _reCommentFilter = "NONE", reCommentSkipLength: _reCommentSkipLength, reCommentTakeLength: _reCommentTakeLength } = req.query;
    const { user } = req.session;

    // request valid
    if (!_id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (_reCommentFilter && !["ALL", "ONLY_CHILDREN", "NONE"].includes(_reCommentFilter.toString())) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // find comment detail
    const id = +_id.toString();
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
          select: {
            id: true,
            userId: true,
          },
        },
        records: {
          where: {
            OR: [{ kind: Kind.CommentLike }],
          },
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

    const reCommentFilter = _reCommentFilter.toString() as ReCommentFilter;
    const reCommentTakeLength = _reCommentTakeLength ? +_reCommentTakeLength.toString() : null;
    const reCommentSkipLength = _reCommentSkipLength ? +_reCommentSkipLength.toString() : null;
    const findReComments: (item: StoryCommentItem) => any | StoryCommentItem = async (item) => {
      const reComments = [];
      const _reComments = await client.storyComment.findMany({
        ...(reCommentTakeLength ? { take: reCommentTakeLength } : {}),
        ...(reCommentSkipLength ? { skip: reCommentSkipLength } : {}),
        where: {
          reCommentRefId: item.id,
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
      for (let index = 0; index < _reComments.length; index++) {
        const reComment = reCommentFilter === "ONLY_CHILDREN" ? _reComments[index] : await findReComments(_reComments[index]);
        reComments.push(reComment);
      }
      return { ...item, reComments };
    };

    // result
    const result: GetCommentsDetailResponse = {
      success: true,
      comment: reCommentFilter === "NONE" ? comment : await findReComments(comment),
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
