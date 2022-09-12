import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Story, Record, User, StoryCategory, StoryComment } from "@prisma/client";
// @api
import { CommentMinimumDepth, CommentMaximumDepth } from "@api/comments/types";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetStoriesResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  stories: (Story & {
    user?: Pick<User, "id" | "name" | "photos">;
    records?: Pick<Record, "id" | "kind" | "emotion" | "userId">[];
    comments?: (Pick<StoryComment, "id"> & Pick<Partial<StoryComment>, "userId" | "content">)[];
  })[];
}

export interface PostStoriesResponse extends ResponseDataType {
  story: Story;
}

export const getStories = async (query: { prevCursor: number; posX: number; posY: number; distance: number }) => {
  const { prevCursor, posX, posY, distance } = query;

  const where = {
    emdPosX: { gte: posX - distance, lte: posX + distance },
    emdPosY: { gte: posY - distance, lte: posY + distance },
  };

  const totalCount = await client.story.count({
    where,
  });

  const stories = await client.story.findMany({
    where,
    take: 10,
    skip: prevCursor ? 1 : 0,
    ...(prevCursor && { cursor: { id: prevCursor } }),
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          photos: true,
        },
      },
      records: {
        select: {
          id: true,
          kind: true,
          emotion: true,
          userId: true,
        },
      },
      comments: {
        where: {
          NOT: [{ content: "" }],
          AND: [{ depth: { gte: CommentMinimumDepth, lte: CommentMaximumDepth } }],
        },
        select: {
          id: true,
        },
      },
    },
  });

  return {
    totalCount,
    stories,
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  if (req.method === "GET") {
    try {
      const { prevCursor: _prevCursor, posX: _posX, posY: _posY, distance: _distance } = req.query;

      // invalid
      if (!_prevCursor) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // early return result
      if (!_posX || !_posY || !_distance) {
        const result: GetStoriesResponse = {
          success: false,
          totalCount: 0,
          lastCursor: 0,
          stories: [],
        };
        return res.status(200).json(result);
      }

      // page
      const prevCursor = +_prevCursor.toString();
      if (isNaN(prevCursor) || prevCursor === -1) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // query
      const posX = +_posX.toString();
      const posY = +_posY.toString();
      const distance = +_distance.toString();

      if (isNaN(posX) || isNaN(posY) || isNaN(distance)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // fetch data
      const { totalCount, stories } = await getStories({ prevCursor, posX, posY, distance });

      // result
      const result: GetStoriesResponse = {
        success: true,
        totalCount,
        lastCursor: stories.length ? stories[stories.length - 1].id : -1,
        stories,
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
      const { photos = [], category, content, emdAddrNm, emdPosNm, emdPosX, emdPosY } = req.body;
      const { user } = req.session;

      // invalid
      if (!content && !category) {
        const error = new Error("Invalid request body");
        throw error;
      }
      if (photos && !Array.isArray(photos)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!isInstance(category, StoryCategory)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!emdAddrNm || !emdPosNm || !emdPosX || !emdPosY) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // create story
      const newStory = await client.story.create({
        data: {
          photos: photos.join(";"),
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
