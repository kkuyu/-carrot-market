import { NextApiRequest, NextApiResponse } from "next";
import { Feeling } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostStoriesEmotionResponse {
  success: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id, feeling: _feeling } = req.query;
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
      select: {
        id: true,
      },
    });
    if (!story) {
      const error = new Error("NotFoundStory");
      error.name = "NotFoundStory";
      throw error;
    }

    // check current curiosity status
    const exists = await client.emotion.findFirst({
      where: {
        userId: user?.id,
        storyId: story.id,
      },
      select: {
        id: true,
        feeling: true,
      },
    });

    const feeling = _feeling?.toString() as Feeling | null;
    if (!exists) {
      // create
      if (!feeling) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      await client.emotion.create({
        data: {
          feeling: feeling,
          user: {
            connect: {
              id: user?.id,
            },
          },
          story: {
            connect: {
              id: story.id,
            },
          },
        },
      });
    } else if (feeling && exists.feeling !== feeling) {
      // update
      await client.emotion.update({
        where: {
          id: exists.id,
        },
        data: {
          feeling: feeling,
          user: {
            connect: {
              id: user?.id,
            },
          },
          story: {
            connect: {
              id: story.id,
            },
          },
        },
      });
    } else {
      // delete
      await client.emotion.delete({
        where: {
          id: exists.id,
        },
      });
    }

    // result
    const result: PostStoriesEmotionResponse = {
      success: true,
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
