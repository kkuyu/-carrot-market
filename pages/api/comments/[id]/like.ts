import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostCommentsLikeResponse extends ResponseDataType {
  likeRecord: Record | null;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id } = req.query;
    const { user } = req.session;

    // invalid
    if (!_id) {
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
      // delete record
      await client.record.delete({
        where: {
          id: existed.id,
        },
      });
    } else {
      // create record
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
      const result = {
        success: false,
        error: {
          timestamp: date,
          name: error.name,
          message: error.message,
        },
      };
      return res.status(422).json(result);
    }
  }
}

export default withSessionRoute(
  withHandler({
    methods: [{ type: "POST", isPrivate: true }],
    handler,
  })
);
