import { NextApiRequest, NextApiResponse } from "next";
import { StoryComment, Kind, Record, Story, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetStoriesDetailResponse {
  success: boolean;
  story: Story & {
    user: Pick<User, "id" | "name" | "avatar">;
    records: Pick<Record, "id" | "kind" | "emotion" | "userId">[];
    comments: (Pick<StoryComment, "id" | "comment" | "emdPosNm" | "createdAt" | "updatedAt"> & { user: Pick<User, "id" | "name" | "avatar"> })[];
    _count: { comments: number };
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
        records: {
          where: {
            kind: Kind.StoryLike,
          },
          select: {
            id: true,
            kind: true,
            emotion: true,
            userId: true,
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
      story,
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
