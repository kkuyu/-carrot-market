import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record } from "@prisma/client";
// @libs
import { getStoryCategory } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { EmotionIcon, EmotionKeys } from "@api/stories/types";

export interface PostStoriesLikeResponse {
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
    const { emotion: _emotion } = req.body;
    const { user } = req.session;

    // request valid
    if (!_id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (_emotion && !Object.keys(EmotionIcon).includes(_emotion.toString())) {
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
      include: {
        records: {
          where: {
            kind: Kind.StoryLike,
            userId: user?.id,
            storyId: id,
          },
        },
      },
    });
    if (!story) {
      const error = new Error("NotFoundStory");
      error.name = "NotFoundStory";
      throw error;
    }

    let likeRecord = null;
    const exists = story.records.length ? story.records[0] : null;

    if (!_emotion) {
      if (exists) {
        // delete
        await client.record.delete({
          where: {
            id: exists.id,
          },
        });
      } else {
        // create
        likeRecord = await client.record.create({
          data: {
            kind: Kind.StoryLike,
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
      }
      // result
      const result: PostStoriesLikeResponse = {
        success: true,
        likeRecord,
      };
      return res.status(200).json(result);
    }

    const emotion = _emotion.toString() as EmotionKeys;
    if (!getStoryCategory(story.category)?.isLikeWithEmotion) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (exists && exists?.emotion !== emotion) {
      // update
      likeRecord = await client.record.update({
        where: {
          id: exists.id,
        },
        data: {
          emotion,
        },
      });
    } else if (exists && exists?.emotion === emotion) {
      // delete
      await client.record.delete({
        where: {
          id: exists.id,
        },
      });
    } else {
      // create
      likeRecord = await client.record.create({
        data: {
          kind: Kind.StoryLike,
          emotion,
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
    }

    // result
    const result: PostStoriesLikeResponse = {
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
