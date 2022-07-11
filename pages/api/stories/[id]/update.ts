import { NextApiRequest, NextApiResponse } from "next";
import { Story } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostStoriesUpdateResponse {
  success: boolean;
  story: Story;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id } = req.query;
    const { photo = "", category, content } = req.body;
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
    });
    if (!story) {
      const error = new Error("NotFoundStory");
      error.name = "NotFoundStory";
      throw error;
    }
    if (story.userId !== user?.id) {
      const error = new Error("NotFoundStory");
      error.name = "NotFoundStory";
      throw error;
    }

    const updateStory = await client.story.update({
      where: {
        id: story.id,
      },
      data: {
        photo,
        category,
        content,
      },
    });

    // result
    const result: PostStoriesUpdateResponse = {
      success: true,
      story: updateStory,
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
