import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record, User, StoryComment, Story } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

type StoryCommentItem = StoryComment & {
  user: Pick<User, "id" | "name" | "avatar">;
  story: Pick<Story, "id" | "userId">;
  records: Pick<Record, "id" | "kind" | "userId">[];
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
    const { id: _id, includeReComments: _includeReComments } = req.query;
    const { user } = req.session;

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
      },
    });
    if (!comment) {
      const error = new Error("NotFoundComment");
      error.name = "NotFoundComment";
      throw error;
    }

    const findReComments: (item: StoryCommentItem) => any | StoryCommentItem = async (item) => {
      const _reComments = await client.storyComment.findMany({
        where: {
          reCommentRefId: item.id,
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
        },
      });
      const reComments = [];
      for (let index = 0; index < _reComments.length; index++) {
        const reComment = await findReComments(_reComments[index]);
        reComments.push(reComment);
      }
      return { ...item, reComments };
    };

    if (!includeReComments) {
      // result
      const result: GetCommentsDetailResponse = {
        success: true,
        comment,
      };
      return res.status(200).json(result);
    }

    // result
    const result: GetCommentsDetailResponse = {
      success: true,
      comment: await findReComments(comment),
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
