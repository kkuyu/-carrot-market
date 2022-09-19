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

export type GetSearchProductsResponse = Pick<GetSearchModelsResponse, "success" | "totalCount" | "lastCursor" | "products">;

export const SearchProductsEnum = {
  ["all"]: "all",
} as const;

export type SearchProductsEnum = typeof SearchProductsEnum[keyof typeof SearchProductsEnum];

export const getSearchProducts = async (query: {
  searchFilter: IronSearchType["filter"];
  filter: SearchProductsEnum | SearchPreviewsEnum;
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
    OR: [...keyword.split(" ").map((word: string) => ({ name: { contains: word } }))],
    ...(searchFilter?.includeSoldProducts ? { AND: { records: { some: { kind: Kind.ProductSale } } } } : {}),
  };

  const totalCount = await client.product.count({
    where,
  });

  const products = await client.product.findMany({
    where,
    take: filter === "preview" ? 4 : 10,
    skip: prevCursor ? 1 : 0,
    ...(prevCursor && { cursor: { id: prevCursor } }),
    orderBy: {
      resumeAt: "desc",
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
  });

  return {
    totalCount,
    products,
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
      const result: GetSearchProductsResponse = {
        success: false,
        totalCount: 0,
        lastCursor: 0,
        products: [],
      };
      return res.status(200).json(result);
    }

    // page
    const filter = _filter.toString() as SearchProductsEnum;
    const prevCursor = +_prevCursor.toString();
    if (!isInstance(filter, SearchProductsEnum)) {
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
    const { totalCount, products } = await getSearchProducts({ searchFilter, filter, keyword, prevCursor, posX, posY, distance });

    // result
    const result: GetSearchProductsResponse = {
      success: true,
      totalCount,
      products,
      lastCursor: products.length ? products[products.length - 1].id : -1,
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
