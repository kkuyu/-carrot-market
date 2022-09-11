import { NextApiRequest, NextApiResponse } from "next";
import { Emotion, Kind, Record } from "@prisma/client";
// @libs
import { getCategory, isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { StoryCategories } from "@api/stories/types";

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
    if (_emotion && !isInstance(_emotion.toString(), Emotion)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const id = +_id.toString();
    const emotion = _emotion ? (_emotion.toString() as Emotion) : null;
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

    // delete record
    if (existed && like === false && (!emotion || (emotion && emotion === existed?.emotion))) {
      await client.record.delete({
        where: {
          id: existed.id,
        },
      });
    }

    // update record
    if (existed && like === false && emotion && emotion !== existed?.emotion) {
      likeRecord = await client.record.update({
        where: {
          id: existed.id,
        },
        data: {
          emotion,
        },
      });
    }

    // create record
    if (!existed && like === true) {
      likeRecord = await client.record.create({
        data: {
          kind: Kind.StoryLike,
          ...(emotion ? { emotion } : {}),
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
