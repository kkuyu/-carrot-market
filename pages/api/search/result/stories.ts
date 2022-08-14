import { NextApiRequest, NextApiResponse } from "next";
import { Kind } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
// @api
import { GetSearchResultResponse } from "@api/search/result";
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { prevCursor: _prevCursor, keyword: _keyword, pageSize: _pageSize, posX: _posX, posY: _posY, distance: _distance } = req.query;

    // invalid
    if (!_prevCursor) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!_keyword) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // early return result
    if (!_posX || !_posY || !_distance) {
      const result: GetSearchResultResponse = {
        success: false,
        totalCount: 0,
        lastCursor: 0,
        products: [],
        stories: [],
      };
      return res.status(200).json(result);
    }

    // page
    const prevCursor = +_prevCursor.toString();
    const pageSize = _pageSize ? +_pageSize.toString() : 10;
    if (isNaN(prevCursor) || prevCursor === -1) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (isNaN(pageSize)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const keyword = _keyword.toString() || "";
    const posX = +_posX.toString();
    const posY = +_posY.toString();
    const distance = +_distance.toString();
    const boundaryArea = {
      emdPosX: { gte: posX - distance, lte: posX + distance },
      emdPosY: { gte: posY - distance, lte: posY + distance },
    };
    if (isNaN(posX) || isNaN(posY) || isNaN(distance)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // where
    const where = {
      ...boundaryArea,
      OR: [
        ...keyword.split(" ").map((word: string) => ({
          content: { contains: word },
        })),
      ],
    };

    // fetch story
    const totalCount = await await client.story.count({
      where,
    });
    const stories = await await client.story.findMany({
      where,
      take: pageSize,
      skip: prevCursor ? 1 : 0,
      ...(prevCursor && { cursor: { id: prevCursor } }),
      orderBy: [{ records: { _count: "desc" } }, { comments: { _count: "desc" } }, { createdAt: "desc" }],
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
          take: 1,
          orderBy: [{ depth: "asc" }, { createdAt: "asc" }],
          where: {
            AND: { depth: { gte: StoryCommentMinimumDepth, lte: StoryCommentMaximumDepth } },
            NOT: [{ content: "" }],
            OR: [
              ...keyword.split(" ").map((word: string) => ({
                content: { contains: word },
              })),
            ],
          },
          select: {
            id: true,
            userId: true,
            content: true,
          },
        },
      },
    });

    // result
    const result: GetSearchResultResponse = {
      success: true,
      totalCount,
      lastCursor: stories.length ? stories[stories.length - 1].id : -1,
      products: [],
      stories,
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
