import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Product, ProductCategory, Record } from "@prisma/client";
// @libs
import { getCategory, isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { ProductCategories } from "@api/products/types";

export interface GetProductsCategoriesResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  products: (Product & { records: Pick<Record, "id" | "kind" | "userId">[]; chats?: (Chat & { _count: { chatMessages: number } })[] })[];
}

export const getProductsCategories = async (query: { prevCursor: number; posX: number; posY: number; distance: number; category: ProductCategory }) => {
  const { prevCursor, posX, posY, distance, category } = query;

  const where = {
    emdPosX: { gte: posX - distance, lte: posX + distance },
    emdPosY: { gte: posY - distance, lte: posY + distance },
    ...(category !== "POPULAR_PRODUCT" ? { category } : {}),
  };

  const totalCount = await client.product.count({
    where,
  });

  const products = await client.product.findMany({
    where,
    take: 10,
    skip: prevCursor ? 1 : 0,
    ...(prevCursor && { cursor: { id: prevCursor } }),
    orderBy: category !== "POPULAR_PRODUCT" ? { resumeAt: "desc" } : [{ records: { _count: "desc" } }, { resumeAt: "desc" }],
    include: {
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
    const { prevCursor: _prevCursor, posX: _posX, posY: _posY, distance: _distance, category: _category } = req.query;

    // invalid
    if (!_prevCursor) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // early return result
    if (!_posX || !_posY || !_distance || !_category) {
      const result: GetProductsCategoriesResponse = {
        success: false,
        totalCount: 0,
        lastCursor: 0,
        products: [],
      };
      return res.status(200).json(result);
    }

    // page
    const prevCursor = +_prevCursor.toString();
    if (isNaN(prevCursor) || prevCursor === -1) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const posX = +_posX.toString();
    const posY = +_posY.toString();
    const distance = +_distance.toString();
    const category = getCategory<ProductCategories>(_category?.toString() || "");
    if (isNaN(posX) || isNaN(posY) || isNaN(distance)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!category || !isInstance(category.value, ProductCategory)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const { totalCount, products } = await getProductsCategories({ prevCursor, posX, posY, distance, category: category.value });

    // result
    const result: GetProductsCategoriesResponse = {
      success: true,
      totalCount,
      lastCursor: products.length ? products[products.length - 1].id : -1,
      products,
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
