import { NextApiRequest, NextApiResponse } from "next";
import { Kind } from "@prisma/client";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { IronSearchType, withSessionRoute } from "@libs/server/withSession";
// @api
import { SearchPreviewsEnum } from "@api/search/result/previews/[filter]";
import { GetSearchModelsResponse } from "@api/search/result/[models]/[filter]";
import { CommentMaximumDepth, CommentMinimumDepth } from "@api/comments/types";

export type GetSearchStoriesResponse = Pick<GetSearchModelsResponse, "success" | "totalCount" | "lastCursor" | "stories">;

export const SearchStoriesEnum = {
  ["all"]: "all",
} as const;

export type SearchStoriesEnum = typeof SearchStoriesEnum[keyof typeof SearchStoriesEnum];

export const getSearchStories = async (query: {
  searchFilter: IronSearchType["filter"];
  filter: SearchStoriesEnum | SearchPreviewsEnum;
  prevCursor: number;
  keyword: string;
  posX: number;
  posY: number;
  distance: number;
}) => {
  const { searchFilter, filter, keyword, prevCursor, posX, posY, distance } = query;

  const where = {
    emdPosX: { gte: posX - distance, lte: posX + distance },
    emdPosY: { gte: posY - distance, lte: posY + distance },
    OR: [...keyword.split(" ").map((word: string) => ({ content: { contains: word } }))],
  };

  const totalCount = await client.story.count({
    where,
  });

  const stories = await client.story.findMany({
    where,
    take: filter === "preview" ? 4 : 10,
    skip: prevCursor ? 1 : 0,
    ...(prevCursor && { cursor: { id: prevCursor } }),
    orderBy: [{ records: { _count: "desc" } }, { comments: { _count: "desc" } }, { createdAt: "desc" }],
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
  try {
    const { search } = req.session;
    const { filter: _filter, keyword: _keyword, prevCursor: _prevCursor, posX: _posX, posY: _posY, distance: _distance } = req.query;

    // invalid
    if (!_filter || !_prevCursor) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // early return result
    if (!_keyword || !_posX || !_posY || !_distance) {
      const result: GetSearchStoriesResponse = {
        success: false,
        totalCount: 0,
        lastCursor: 0,
        stories: [],
      };
      return res.status(200).json(result);
    }

    // page
    const filter = _filter.toString() as SearchStoriesEnum;
    const prevCursor = +_prevCursor.toString();
    if (!isInstance(filter, SearchStoriesEnum)) {
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
    const searchFilter = search?.filter ?? {};
    const keyword = _keyword.toString() || "";
    const posX = +_posX.toString();
    const posY = +_posY.toString();
    const distance = +_distance.toString();
    if (isNaN(posX) || isNaN(posY) || isNaN(distance)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const { totalCount, stories } = await getSearchStories({ searchFilter, filter, keyword, prevCursor, posX, posY, distance });

    // result
    const result: GetSearchStoriesResponse = {
      success: true,
      totalCount,
      stories,
      lastCursor: stories.length ? stories[stories.length - 1].id : -1,
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
