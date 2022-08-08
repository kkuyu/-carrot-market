import { NextApiRequest, NextApiResponse } from "next";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostStoriesDeleteResponse extends ResponseDataType {}

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
    const story = await client.story.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
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

    // delete record
    await client.record.deleteMany({
      where: {
        storyId: story.id,
      },
    });

    // delete story comment
    await client.storyComment.deleteMany({
      where: {
        storyId: story.id,
      },
    });

    // delete story
    await client.story.delete({
      where: {
        id: story.id,
      },
    });

    // result
    const result: PostStoriesDeleteResponse = {
      success: true,
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
