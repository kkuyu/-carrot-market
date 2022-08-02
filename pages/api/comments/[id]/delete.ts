import { NextApiRequest, NextApiResponse } from "next";
import { StoryComment } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostCommentsDeleteResponse {
  success: boolean;
  comment: StoryComment | null;
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
      select: {
        id: true,
        userId: true,
        storyId: true,
        reCommentRefId: true,
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
    if (comment.userId !== user?.id) {
      const error = new Error("NotFoundComment");
      error.name = "NotFoundComment";
      throw error;
    }

    // remove record
    await client.record.deleteMany({
      where: {
        commentId: comment.id,
      },
    });

    let newComment = null;
    if (!comment._count.reComments) {
      // delete comment
      await client.storyComment.delete({
        where: {
          id: comment.id,
        },
      });
    } else {
      // update comment
      newComment = await client.storyComment.update({
        where: {
          id: comment.id,
        },
        data: {
          comment: null,
        },
      });
    }

    const reCommentRef = !comment?.reCommentRefId
      ? null
      : await client.storyComment.findUnique({
          where: {
            id: comment?.reCommentRefId,
          },
          select: {
            id: true,
            comment: true,
            _count: {
              select: {
                reComments: true,
              },
            },
          },
        });

    if (!newComment && reCommentRef?.id && !reCommentRef?.comment && !reCommentRef?._count.reComments) {
      // delete reCommentRef
      await client.storyComment.delete({
        where: {
          id: reCommentRef?.id,
        },
      });
    }

    // result
    const result: PostCommentsDeleteResponse = {
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

export default withSessionRoute(
  withHandler({
    methods: [{ type: "POST", isPrivate: true }],
    handler,
  })
);
