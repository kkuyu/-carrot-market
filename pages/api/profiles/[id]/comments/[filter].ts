import { NextApiRequest, NextApiResponse } from "next";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { CommentMaximumDepth, CommentMinimumDepth } from "@api/comments/types";
import { GetProfilesDetailModelsResponse } from "@api/profiles/[id]/[manners]/[filter]";

export type GetProfilesDetailCommentsResponse = Pick<GetProfilesDetailModelsResponse, "success" | "totalCount" | "lastCursor" | "comments">;

export const ProfileCommentsFilterEnum = {
  ["all"]: "all",
} as const;

export type ProfileCommentsFilterEnum = typeof ProfileCommentsFilterEnum[keyof typeof ProfileCommentsFilterEnum];

export const getProfilesDetailComments = async (query: { filter: ProfileCommentsFilterEnum; id: number; prevCursor: number }) => {
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
    const filter = _filter.toString() as ProfileCommentsFilterEnum;
    const prevCursor = +_prevCursor.toString();
    if (!isInstance(filter, ProfileCommentsFilterEnum)) {
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
    const { totalCount, comments } = await getProfilesDetailComments({ filter, id, prevCursor });

    // result
    const result: GetProfilesDetailCommentsResponse = {
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
