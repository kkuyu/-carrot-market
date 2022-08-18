import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record, Story, StoryComment, User } from "@prisma/client";
// @libs
import { isInstance } from "@libs/utils";
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
    comments?: (Pick<StoryComment, "id"> & Pick<Partial<StoryComment>, "userId" | "content">)[];
  })[];
  comments: (StoryComment & {
    user: Pick<User, "id" | "name" | "avatar">;
    story: Pick<Story, "id" | "content" | "createdAt">;
    records: Pick<Record, "id" | "kind" | "userId">[];
  })[];
}

export const StoriesFilterEnum = {
  ["index"]: "index",
  ["comment"]: "comment",
} as const;

export type StoriesFilterEnum = typeof StoriesFilterEnum[keyof typeof StoriesFilterEnum];

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
    const prevCursor = +_prevCursor.toString();
    const pageSize = 10;
    if (isNaN(prevCursor) || prevCursor === -1) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const id = +_id.toString();
    const filter = _filter.toString() as StoriesFilterEnum;
    if (isNaN(id)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!isInstance(filter, StoriesFilterEnum)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    const whereByStory = {
      userId: id,
    };
    const whereByComment = {
      userId: id,
      NOT: [{ content: "" }],
      AND: [{ depth: { gte: StoryCommentMinimumDepth, lte: StoryCommentMaximumDepth } }],
    };

    // fetch data
    const totalCount =
      filter === "index"
        ? await client.story.count({
            where: whereByStory,
          })
        : filter === "comment"
        ? await client.storyComment.count({
            where: whereByComment,
          })
        : 0;

    const stories =
      filter === "index"
        ? await client.story.findMany({
            where: whereByStory,
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
                  NOT: [{ content: "" }],
                  AND: [{ depth: { gte: StoryCommentMinimumDepth, lte: StoryCommentMaximumDepth } }],
                },
                select: {
                  id: true,
                },
              },
            },
          })
        : [];

    const comments =
      filter === "comment"
        ? await client.storyComment.findMany({
            where: whereByComment,
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
                  kind: Kind.CommentLike,
                },
                select: {
                  id: true,
                  kind: true,
                  userId: true,
                },
              },
              story: {
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                },
              },
            },
          })
        : [];

    // result
    const result: GetProfilesStoriesResponse = {
      success: true,
      totalCount,
      lastCursor: filter === "index" ? (stories.length ? stories[stories.length - 1].id : -1) : filter === "comment" ? (comments.length ? comments[comments.length - 1].id : -1) : -1,
      stories,
      comments,
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
