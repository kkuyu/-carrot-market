import { NextApiRequest, NextApiResponse } from "next";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { CommentMaximumDepth, CommentMinimumDepth } from "@api/comments/types";
import { GetProfilesModelsResponse } from "@api/profiles/[id]/[models]/[filter]";

export type GetProfilesStoriesResponse = Pick<GetProfilesModelsResponse, "success" | "totalCount" | "lastCursor" | "stories">;

export const ProfileStoriesEnum = {
  ["all"]: "all",
} as const;

export type ProfileStoriesEnum = typeof ProfileStoriesEnum[keyof typeof ProfileStoriesEnum];

export const getProfilesStories = async (query: { filter: ProfileStoriesEnum; id: number; prevCursor: number }) => {
  const { filter, id, prevCursor } = query;

  const where = {
    userId: id,
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
          NOT: { content: "" },
          AND: { depth: { gte: CommentMinimumDepth, lte: CommentMaximumDepth } },
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
  try {
    const { filter: _filter, id: _id, prevCursor: _prevCursor } = req.query;

    // invalid
    if (!_filter || !_id || !_prevCursor) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // page
    const filter = _filter.toString() as ProfileStoriesEnum;
    const prevCursor = +_prevCursor.toString();
    if (!isInstance(filter, ProfileStoriesEnum)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (isNaN(prevCursor) || prevCursor === -1) {
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
    const { totalCount, stories } = await getProfilesStories({ filter, id, prevCursor });

    // result
    const result: GetProfilesStoriesResponse = {
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

export default withSessionRoute(
  withHandler({
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
