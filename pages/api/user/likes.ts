import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record, ProductReview } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetUserLikeResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  products: (Product & {
    records: Pick<Record, "id" | "kind" | "userId">[];
    reviews: Pick<ProductReview, "id" | "role" | "sellUserId" | "purchaseUserId">[];
    chats?: (Chat & { _count: { chatMessages: number } })[];
  })[];
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { prevCursor: _prevCursor } = req.query;
    const { user } = req.session;

    // invalid
    if (!_prevCursor) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // page
    const prevCursor = +_prevCursor.toString();
    const pageSize = 10;
    if (isNaN(prevCursor) || prevCursor === -1) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // search
    const where = {
      userId: user?.id,
      kind: Kind.ProductLike,
    };

    // fetch data
    const totalCount = await client.record.count({
      where,
    });
    const records = await client.record.findMany({
      where,
      take: pageSize,
      skip: prevCursor ? 1 : 0,
      ...(prevCursor && { cursor: { id: prevCursor } }),
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
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
        },
      },
    });

    const products = records.map((record) => (record.product ? record.product : [])) as GetUserLikeResponse["products"];

    // result
    const result: GetUserLikeResponse = {
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
    methods: [{ type: "GET", isPrivate: true }],
    handler,
  })
);
