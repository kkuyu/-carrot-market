import { NextApiRequest, NextApiResponse } from "next";
import { Feeling, Story, User } from "@prisma/client";
// @libs
import { getCategory } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetStoriesResponse {
  success: boolean;
  stories: (Story & {
    user: Pick<User, "id" | "name">;
    curiosity: boolean;
    curiosities: { count: number };
    emotion: Feeling | null;
    emotions: { count: number; feelings: Feeling[] };
    _count: { curiosities: number; emotions: number; comments: number };
  })[];
  pages: number;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

export interface PostStoriesResponse {
  success: boolean;
  story: Story;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    try {
      const { page: _page, posX: _posX, posY: _posY, distance: _distance } = req.query;
      const { user } = req.session;

      // request valid
      if (!_page) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!_posX || !_posY || !_distance) {
        const result: GetStoriesResponse = {
          success: true,
          stories: [],
          pages: 1,
        };
        return res.status(200).json(result);
      }

      // get data props
      const displayRow = 10;
      const page = +_page.toString();
      const posX = +_posX.toString();
      const posY = +_posY.toString();
      const distance = +_distance.toString();
      const boundaryArea = {
        emdPosX: { gte: posX - distance, lte: posX + distance },
        emdPosY: { gte: posY - distance, lte: posY + distance },
      };

      // fetch data: client.stories
      const totalStories = await client.story.count({
        where: boundaryArea,
      });
      const stories = await (
        await client.story.findMany({
          take: displayRow,
          skip: (page - 1) * displayRow,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
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
            _count: {
              select: {
                curiosities: true,
                emotions: true,
                comments: true,
              },
            },
          },
          where: boundaryArea,
        })
      ).map((story) => {
        return {
          ...story,
          curiosity: !user?.id ? false : Boolean(story.curiosities.find((v) => v.userId === user.id)),
          curiosities: { count: story.curiosities.length },
          emotion: !user?.id ? null : story.emotions.find((v) => v.userId === user.id)?.feeling || null,
          emotions: { count: story.emotions.length, feelings: [...new Set(story.emotions.map((v) => v.feeling))] },
        };
      });

      // result
      const result: GetStoriesResponse = {
        success: true,
        stories,
        pages: Math.ceil(totalStories / displayRow),
      };
      return res.status(200).json(result);
    } catch (error: unknown) {
      // error
      if (error instanceof Error) {
        const result = {
          success: false,
          error: {
            timestamp: Date.now().toString(),
            name: error.name,
            message: error.message,
          },
        };
        return res.status(422).json(result);
      }
    }
  }
  if (req.method === "POST") {
    try {
      const { photos = "", category, content, emdAddrNm, emdPosNm, emdPosX, emdPosY } = req.body;
      const { user } = req.session;

      // request valid
      if (!content && !category) {
        const error = new Error("Invalid request body");
        throw error;
      }
      if (!getCategory("story", category)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!emdAddrNm || !emdPosNm || !emdPosX || !emdPosY) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // create new story
      const newStory = await client.story.create({
        data: {
          photos,
          content,
          category,
          emdAddrNm,
          emdPosNm,
          emdPosX,
          emdPosY,
          user: {
            connect: {
              id: user?.id,
            },
          },
        },
      });

      // result
      const result: PostStoriesResponse = {
        success: true,
        story: newStory,
      };
      return res.status(200).json(result);
    } catch (error: unknown) {
      // error
      if (error instanceof Error) {
        const result = {
          success: false,
          error: {
            timestamp: Date.now().toString(),
            name: error.name,
            message: error.message,
          },
        };
        return res.status(422).json(result);
      }
    }
  }
}

export default withSessionRoute(
  withHandler({
    methods: [
      { type: "GET", isPrivate: false },
      { type: "POST", isPrivate: true },
    ],
    handler,
  })
);
