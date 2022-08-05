import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record, Story, StoryComment, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";

export type ProfilesStoriesFilter = "STORY" | "COMMENT";

export interface GetProfilesStoriesResponse {
  success: boolean;
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
  pages: number;
  total: number;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id, filter: _filter, page: _page } = req.query;

    // request valid
    if (!_id || !_filter) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!_page) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data: client.story
    const id = +_id.toString();
    const filter = _filter.toString() as ProfilesStoriesFilter;
    const displayRow = 10;
    const page = +_page.toString();

    const totalCount =
      filter === "STORY"
        ? await client.story.count({
            where: {
              userId: id,
            },
          })
        : filter === "COMMENT"
        ? await client.storyComment.count({
            where: {
              userId: id,
              NOT: [{ content: "" }],
            },
          })
        : 0;

    const stories =
      filter === "STORY"
        ? await client.story.findMany({
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
            where: {
              userId: id,
            },
          })
        : [];

    const comments =
      filter === "COMMENT"
        ? await client.storyComment.findMany({
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
            where: {
              userId: id,
              NOT: [{ content: "" }],
            },
          })
        : [];

    // result
    const result: GetProfilesStoriesResponse = {
      success: true,
      stories,
      comments,
      pages: Math.ceil(totalCount / displayRow),
      total: totalCount,
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
