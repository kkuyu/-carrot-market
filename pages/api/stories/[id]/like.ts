import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record } from "@prisma/client";
// @libs
import { getCategory } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { StoryCategories, EmotionIcon, EmotionKeys } from "@api/stories/types";

export interface PostStoriesLikeResponse extends ResponseDataType {
  likeRecord: Record | null;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id } = req.query;
    const { like, emotion: _emotion } = req.body;
    const { user } = req.session;

    // invalid
    if (!_id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (typeof like !== "boolean") {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (_emotion && !Object.keys(EmotionIcon).includes(_emotion.toString())) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const id = +_id.toString();
    const emotion = _emotion ? (_emotion.toString() as EmotionKeys) : null;
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
      include: {
        records: true,
      },
    });
    if (!story) {
      const error = new Error("NotFoundStory");
      error.name = "NotFoundStory";
      throw error;
    }
    if (!emotion && getCategory<StoryCategories>(story.category)?.isLikeWithEmotion) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (emotion && !getCategory<StoryCategories>(story.category)?.isLikeWithEmotion) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    let likeRecord = null;
    const existed = story.records.find((record) => record.kind === Kind.StoryLike && record.userId === user?.id) || null;

    // early return result
    if (!_emotion) {
      if (existed && like === false) {
        // delete record
        await client.record.delete({
          where: {
            id: existed.id,
          },
        });
      } else if (!existed && like === true) {
        // create record
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

    if (existed && like === false && existed?.emotion !== emotion) {
      // update record
      likeRecord = await client.record.update({
        where: {
          id: existed.id,
        },
        data: {
          emotion,
        },
      });
    } else if (existed && like === false && existed?.emotion === emotion) {
      // delete record
      await client.record.delete({
        where: {
          id: existed.id,
        },
      });
    } else if (!existed && like === true) {
      // create record
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
