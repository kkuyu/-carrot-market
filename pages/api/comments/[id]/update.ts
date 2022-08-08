import { NextApiRequest, NextApiResponse } from "next";
import { StoryComment } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostCommentsUpdateResponse extends ResponseDataType {
  comment: StoryComment;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id } = req.query;
    const { content } = req.body;
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

    // update story comment
    const updateComment = await client.storyComment.update({
      where: {
        id: comment.id,
      },
      data: {
        content,
      },
    });

    // result
    const result: PostCommentsUpdateResponse = {
      success: true,
      comment: updateComment,
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
