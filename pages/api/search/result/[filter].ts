import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record, Story, StoryComment, User } from "@prisma/client";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
// @api
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";

export interface GetSearchResultResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  products: (Product & {
    records: Pick<Record, "id" | "kind" | "userId">[];
    chats?: (Chat & { _count: { chatMessages: number } })[];
  })[];
  stories: (Story & {
    user: Pick<User, "id" | "name" | "avatar">;
    records: Pick<Record, "id" | "kind" | "emotion" | "userId">[];
    comments?: Pick<StoryComment, "id" | "userId" | "content">[];
  })[];
  productTotalCount?: number;
  storyTotalCount?: number;
}

export const ResultsFilterEnum = {
  ["all"]: "all",
  ["product"]: "product",
  ["story"]: "story",
} as const;

export type ResultsFilterEnum = typeof ResultsFilterEnum[keyof typeof ResultsFilterEnum];

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { search } = req.session;
    const { filter: _filter, prevCursor: _prevCursor, keyword: _keyword, posX: _posX, posY: _posY, distance: _distance } = req.query;

    // invalid
    if (!_filter || !_prevCursor) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // early return result
    if (!_keyword || !_posX || !_posY || !_distance) {
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
    const filter = _filter.toString() as ResultsFilterEnum;
    const prevCursor = +_prevCursor.toString();
    const pageSize = filter === "all" ? 4 : 10;
    if (!isInstance(filter, ResultsFilterEnum)) {
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
    const keyword = _keyword.toString() || "";
    const excludeSold = search?.productFilter?.excludeSold || false;
    const includeSold = !excludeSold;
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

    // search
    const whereByProduct = {
      ...boundaryArea,
      OR: [...keyword.split(" ").map((word: string) => ({ name: { contains: word } }))],
      ...(!includeSold ? { AND: { records: { some: { kind: Kind.ProductSale } } } } : {}),
    };
    const whereByStory = {
      ...boundaryArea,
      OR: [...keyword.split(" ").map((word: string) => ({ content: { contains: word } }))],
    };

    // fetch product
    const productTotalCount =
      filter === "all" || filter === "product"
        ? await client.product.count({
            where: whereByProduct,
          })
        : 0;
    const products =
      filter === "all" || filter === "product"
        ? await client.product.findMany({
            where: whereByProduct,
            take: pageSize,
            skip: prevCursor ? 1 : 0,
            ...(prevCursor && { cursor: { id: prevCursor } }),
            orderBy: {
              resumeAt: "desc",
            },
            include: {
              records: {
                where: {
                  OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductLike }],
                },
                select: {
                  id: true,
                  kind: true,
                  userId: true,
                },
              },
              chats: {
                include: {
                  _count: {
                    select: {
                      chatMessages: true,
                    },
                  },
                },
              },
            },
          })
        : [];

    // fetch story
    const storyTotalCount =
      filter === "all" || filter === "story"
        ? await await client.story.count({
            where: whereByStory,
          })
        : 0;
    const stories =
      filter === "all" || filter === "story"
        ? await await client.story.findMany({
            where: whereByStory,
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
                  OR: [
                    ...keyword.split(" ").map((word: string) => ({
                      content: { contains: word },
                    })),
                  ],
                  NOT: [{ content: "" }],
                  AND: [{ depth: { gte: StoryCommentMinimumDepth, lte: StoryCommentMaximumDepth } }],
                },
                select: {
                  id: true,
                  depth: true,
                  userId: true,
                  content: true,
                },
              },
            },
          })
        : [];

    // result
    if (filter === "product") {
      const result: GetSearchResultResponse = {
        success: true,
        totalCount: productTotalCount,
        lastCursor: products.length ? products[products.length - 1].id : -1,
        products,
        stories: [],
      };
      return res.status(200).json(result);
    }
    if (filter === "story") {
      const result: GetSearchResultResponse = {
        success: true,
        totalCount: storyTotalCount,
        lastCursor: stories.length ? stories[stories.length - 1].id : -1,
        products: [],
        stories,
      };
      return res.status(200).json(result);
    }
    const result: GetSearchResultResponse = {
      success: true,
      totalCount: 0,
      lastCursor: -1,
      productTotalCount,
      storyTotalCount,
      products: products.slice(0, 4),
      stories: stories.slice(0, 4),
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
