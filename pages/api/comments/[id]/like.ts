import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostCommentsLikeResponse {
  success: boolean;
  likeRecord: Record | null;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id } = req.query;
    const { user } = req.session;

    // request valid
    if (!_id) {
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
        records: {
          where: {
            kind: Kind.CommentLike,
            userId: user?.id,
            commentId: id,
          },
        },
      },
    });
    if (!comment) {
      const error = new Error("NotFoundComment");
      error.name = "NotFoundComment";
      throw error;
    }

    let likeRecord = null;
    const existed = comment.records.length ? comment.records[0] : null;

    if (existed) {
      // delete
      await client.record.delete({
        where: {
          id: existed.id,
        },
      });
    } else {
      // create
      likeRecord = await client.record.create({
        data: {
          kind: Kind.CommentLike,
          user: {
            connect: {
              id: user?.id,
            },
          },
          comment: {
            connect: {
              id: comment.id,
            },
          },
        },
      });
    }
    // result
    const result: PostCommentsLikeResponse = {
      success: true,
      likeRecord,
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
    methods: [{ type: "POST", isPrivate: true }],
    handler,
  })
);
