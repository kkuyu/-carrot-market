import { NextApiRequest, NextApiResponse } from "next";
import { Kind } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { isInstance } from "@libs/utils";
import { GetUserDetailModelsResponse } from "@api/user/[models]/[filter]";

export type GetUserDetailProductsResponse = Pick<GetUserDetailModelsResponse, "success" | "totalCount" | "lastCursor" | "products">;

export const UserProductsFilterEnum = {
  ["purchase"]: "purchase",
  ["like"]: "like",
} as const;

export type UserProductsFilterEnum = typeof UserProductsFilterEnum[keyof typeof UserProductsFilterEnum];

export const getUserDetailProducts = async (query: { filter: UserProductsFilterEnum; prevCursor: number; userId: number }) => {
  const { filter, prevCursor, userId } = query;

  const where = {
    userId: userId,
    records: {
      some: { kind: filter === "like" ? Kind.ProductLike : Kind.ProductPurchase },
    },
  };

  const totalCount = await client.product.count({
    where,
  });

  const products = await client.product.findMany({
    where,
    take: 10,
    skip: prevCursor ? 1 : 0,
    ...(prevCursor && { cursor: { id: prevCursor } }),
    orderBy: {
      resumeAt: "desc",
    },
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

  return {
    totalCount,
    products,
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { filter: _filter, prevCursor: _prevCursor } = req.query;
    const { user } = req.session;

    // invalid
    if (!_filter || !_prevCursor || !user?.id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // page
    const filter = _filter.toString() as UserProductsFilterEnum;
    const prevCursor = +_prevCursor.toString();
    if (!isInstance(filter, UserProductsFilterEnum)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (isNaN(prevCursor) || prevCursor === -1) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const { totalCount, products } = await getUserDetailProducts({ filter, prevCursor, userId: user?.id });

    // result
    const result: GetUserDetailProductsResponse = {
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
