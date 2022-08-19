import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record, ProductReview } from "@prisma/client";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProfilesProductsResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  products: (Product & {
    records: Pick<Record, "id" | "kind" | "userId">[];
    chats?: (Chat & { _count: { chatMessages: number } })[];
    reviews?: Pick<ProductReview, "id" | "role" | "sellUserId" | "purchaseUserId">[];
  })[];
}

export const ProductsFilterEnum = {
  ["all"]: "all",
  ["sale"]: "sale",
  ["sold"]: "sold",
} as const;

export type ProductsFilterEnum = typeof ProductsFilterEnum[keyof typeof ProductsFilterEnum];

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
    const filter = _filter.toString() as ProductsFilterEnum;
    const prevCursor = +_prevCursor.toString();
    const pageSize = 10;
    if (!isInstance(filter, ProductsFilterEnum)) {
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

    // search
    const where = {
      userId: id,
      ...(filter === "all" ? {} : {}),
      ...(filter === "sale" ? { AND: { records: { some: { kind: Kind.ProductSale } } } } : {}),
      ...(filter === "sold" ? { NOT: { records: { some: { kind: Kind.ProductSale } } } } : {}),
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
      orderBy: {
        resumeAt: "desc",
      },
      include: {
        records: {
          where: {
            OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductLike }, { kind: Kind.ProductPurchase }],
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
        reviews: {
          select: {
            id: true,
            role: true,
            sellUserId: true,
            purchaseUserId: true,
          },
        },
      },
    });

    // result
    const result: GetProfilesProductsResponse = {
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
