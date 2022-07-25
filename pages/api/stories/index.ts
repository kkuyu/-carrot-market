import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Story, Record, User } from "@prisma/client";
// @libs
import { getStoryCategory } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetStoriesResponse {
  success: boolean;
  stories: (Story & {
    user: Pick<User, "id" | "name">;
    records: Pick<Record, "id" | "kind" | "emotion" | "userId">[];
    _count: { comments: number };
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
      const stories = await await client.story.findMany({
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
          _count: {
            select: {
              comments: true,
            },
          },
        },
        where: boundaryArea,
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
      if (!getStoryCategory(category)) {
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
