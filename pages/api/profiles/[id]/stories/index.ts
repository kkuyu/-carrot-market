import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record, Story, StoryComment, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";

export interface GetProfilesStoriesResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  stories: (Story & {
    user: Pick<User, "id" | "name" | "avatar">;
    records: Pick<Record, "id" | "kind" | "emotion" | "userId">[];
    comments?: Pick<StoryComment, "id">[];
  })[];
  comments: (StoryComment & {
    user: Pick<User, "id" | "name" | "avatar">;
    story: Pick<Story, "id" | "content" | "createdAt">;
    records: Pick<Record, "id" | "kind" | "userId">[];
  })[];
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id, prevCursor: _prevCursor } = req.query;

    // invalid
    if (!_id || !_prevCursor) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // page
    const prevCursor = +_prevCursor.toString();
    const pageSize = 10;
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

    // search
    const where = {
      userId: id,
    };

    // fetch data
    const totalCount = await client.story.count({
      where,
    });
    const stories = await client.story.findMany({
      where,
      take: pageSize,
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
          where: {
            depth: {
              gte: StoryCommentMinimumDepth,
              lte: StoryCommentMaximumDepth,
            },
            NOT: [{ content: "" }],
          },
          select: {
            id: true,
          },
        },
      },
    });

    // result
    const result: GetProfilesStoriesResponse = {
      success: true,
      totalCount,
      lastCursor: stories.length ? stories[stories.length - 1].id : -1,
      stories,
      comments: [],
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
