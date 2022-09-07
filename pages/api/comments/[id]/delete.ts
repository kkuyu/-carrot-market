import { NextApiRequest, NextApiResponse } from "next";
import { StoryComment } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostCommentsDeleteResponse extends ResponseDataType {
  comment: StoryComment | null;
  storyId: number;
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
      select: {
        id: true,
        userId: true,
        storyId: true,
        reCommentRef: {
          select: {
            id: true,
            _count: {
              select: {
                reComments: true,
              },
            },
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
    if (comment.userId !== user?.id) {
      const error = new Error("NotFoundComment");
      error.name = "NotFoundComment";
      throw error;
    }

    // delete record
    await client.record.deleteMany({
      where: {
        commentId: comment.id,
      },
    });

    let newComment = null;
    if (!comment._count.reComments) {
      // delete story comment
      await client.storyComment.delete({
        where: {
          id: comment.id,
        },
      });
    } else {
      // update story comment
      newComment = await client.storyComment.update({
        where: {
          id: comment.id,
        },
        data: {
          content: "",
        },
      });
    }

    if (comment?.reCommentRef?._count?.reComments === 1) {
      await client.storyComment.delete({
        where: {
          id: comment?.reCommentRef?.id,
        },
      });
    }

    // result
    const result: PostCommentsDeleteResponse = {
      success: true,
      comment: newComment,
      storyId: comment.storyId,
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
