import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, ProductCategory, Record } from "@prisma/client";
// @libs
import { getCategory, isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { ProductCategories } from "../types";

export interface GetProductsResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  products: (Product & { records: Pick<Record, "id" | "kind" | "userId">[]; chats?: (Chat & { _count: { chatMessages: number } })[] })[];
}

export interface PostProductsResponse extends ResponseDataType {
  product: Product;
}

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
      const result: GetProductsResponse = {
        success: false,
        totalCount: 0,
        lastCursor: 0,
        products: [],
      };
      return res.status(200).json(result);
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
    const category = getCategory<ProductCategories>(_category?.toString() || "");
    const posX = +_posX.toString();
    const posY = +_posY.toString();
    const distance = +_distance.toString();
    const boundaryArea = {
      emdPosX: { gte: posX - distance, lte: posX + distance },
      emdPosY: { gte: posY - distance, lte: posY + distance },
    };
    if (!category || !isInstance(category.value, ProductCategory)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (isNaN(posX) || isNaN(posY) || isNaN(distance)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // search
    const where = {
      ...boundaryArea,
      ...(category.value === "POPULAR_PRODUCT" ? {} : { category: category.value }),
    };

    // fetch data
    const totalCount = await client.product.count({
      where,
    });
    const products = await client.product.findMany({
      where,
      take: pageSize,
      skip: prevCursor ? 1 : 0,
      ...(prevCursor && { cursor: { id: prevCursor } }),
      orderBy: category.value === "POPULAR_PRODUCT" ? [{ records: { _count: "desc" } }, { resumeAt: "desc" }] : { resumeAt: "desc" },
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
    });

    // result
    const result: GetProductsResponse = {
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
