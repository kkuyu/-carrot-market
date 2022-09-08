import { NextApiRequest, NextApiResponse } from "next";
import { StoryComment, Kind, Record, Story, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth, StoryCategories } from "@api/stories/types";
import { getStoryCondition } from "@libs/utils";

export interface StoryCondition {
  role: {
    myRole: "author" | "reader" | "unknown";
  };
  likes: number;
  category?: StoryCategories[number] & { kebabCaseValue: string };
  emotion?: string | null;
  emojis?: string | null;
  emoji?: string | null;
  comments?: number;
  isLike?: boolean;
}

export interface GetStoriesDetailResponse extends ResponseDataType {
  story: Story & {
    user?: Pick<User, "id" | "name" | "avatar">;
    records?: Pick<Record, "id" | "kind" | "emotion" | "userId">[];
    comments?: Pick<StoryComment, "id">[];
  };
  storyCondition?: StoryCondition | null;
}

export const getStoriesDetail = async (query: { id: number; userId?: number }) => {
  const { id, userId } = query;

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
  });

  const storyCondition = getStoryCondition(story, userId || null);

  return { story, storyCondition };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id } = req.query;
    const { user } = req.session;

    // invalid
    if (!_id) {
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
    const { story, storyCondition } = await getStoriesDetail({ id, userId: user?.id });
    if (!story) {
      const error = new Error("NotFoundStory");
      error.name = "NotFoundStory";
      throw error;
    }

    // result
    const result: GetStoriesDetailResponse = {
      success: true,
      story,
      storyCondition,
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
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
