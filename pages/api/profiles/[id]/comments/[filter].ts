import { NextApiRequest, NextApiResponse } from "next";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { CommentMaximumDepth, CommentMinimumDepth } from "@api/comments/types";
import { GetProfilesModelsResponse } from "@api/profiles/[id]/[models]/[filter]";

export type GetProfilesCommentsResponse = Pick<GetProfilesModelsResponse, "success" | "totalCount" | "lastCursor" | "comments">;

export const ProfileCommentsEnum = {
  ["all"]: "all",
} as const;

export type ProfileCommentsEnum = typeof ProfileCommentsEnum[keyof typeof ProfileCommentsEnum];

export const getProfilesComments = async (query: { filter: ProfileCommentsEnum; id: number; prevCursor: number }) => {
  const { filter, id, prevCursor } = query;

  const where = {
    userId: id,
    NOT: [{ content: "" }],
    AND: [{ depth: { gte: CommentMinimumDepth, lte: CommentMaximumDepth } }],
  };

  const totalCount = await client.storyComment.count({
    where,
  });

  const comments = await client.storyComment.findMany({
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
  });

  return {
    totalCount,
    comments,
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
    const filter = _filter.toString() as ProfileCommentsEnum;
    const prevCursor = +_prevCursor.toString();
    if (!isInstance(filter, ProfileCommentsEnum)) {
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
    const { totalCount, comments } = await getProfilesComments({ filter, id, prevCursor });

    // result
    const result: GetProfilesCommentsResponse = {
      success: true,
      totalCount,
      lastCursor: comments.length ? comments[comments.length - 1].id : -1,
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
