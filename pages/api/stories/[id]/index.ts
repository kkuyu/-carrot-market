import { NextApiRequest, NextApiResponse } from "next";
import { Comment, Feeling, Story, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetStoriesDetailResponse {
  success: boolean;
  story: Story & {
    user: Pick<User, "id" | "name" | "avatar">;
    curiosity: boolean;
    curiosities: { count: number };
    emotion: Feeling | null;
    emotions: { count: number; feelings: Feeling[] };
    comments: (Pick<Comment, "id" | "comment" | "emdPosNm" | "createdAt" | "updatedAt"> & { user: Pick<User, "id" | "name" | "avatar"> })[];
    _count: { curiosities: number; emotions: number; comments: number };
  };
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

    // find story detail
    const id = +_id.toString();
    const story = await client.story.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        curiosities: {
          select: {
            id: true,
            userId: true,
          },
        },
        emotions: {
          select: {
            id: true,
            userId: true,
            feeling: true,
          },
        },
        comments: {
          select: {
            id: true,
            comment: true,
            createdAt: true,
            updatedAt: true,
            emdPosNm: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            curiosities: true,
            emotions: true,
            comments: true,
          },
        },
      },
    });
    if (!story) {
      const error = new Error("NotFoundStory");
      error.name = "NotFoundStory";
      throw error;
    }

    // result
    const result: GetStoriesDetailResponse = {
      success: true,
      story: {
        ...story,
        curiosity: !user?.id ? false : Boolean(story.curiosities.find((v) => v.userId === user.id)),
        curiosities: { count: story.curiosities.length },
        emotion: !user?.id ? null : story.emotions.find((v) => v.userId === user.id)?.feeling || null,
        emotions: { count: story.emotions.length, feelings: [...new Set(story.emotions.map((v) => v.feeling))] },
      },
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
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
