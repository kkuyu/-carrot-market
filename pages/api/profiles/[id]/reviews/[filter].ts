import { NextApiRequest, NextApiResponse } from "next";
import { User, ProductReview } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { isInstance } from "@libs/utils";

export interface GetProfilesReviewsResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  reviews: (ProductReview & { purchaseUser?: Pick<User, "id" | "name" | "avatar">; sellUser?: Pick<User, "id" | "name" | "avatar"> })[];
}

export const ReviewsFilterEnum = {
  ["all"]: "all",
  ["purchaseUser"]: "purchaseUser",
  ["sellUser"]: "sellUser",
} as const;

export type ReviewsFilterEnum = typeof ReviewsFilterEnum[keyof typeof ReviewsFilterEnum];

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
    const prevCursor = +_prevCursor.toString();
    const pageSize = 10;
    if (isNaN(prevCursor) || prevCursor === -1) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const id = +_id.toString();
    const filter = _filter.toString() as ReviewsFilterEnum;
    if (isNaN(id)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!isInstance(filter, ReviewsFilterEnum)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // search
    const where = {
      satisfaction: {
        not: "dislike",
      },
      text: {
        not: "",
      },
      ...(filter === "all"
        ? {
            OR: [
              { role: "sellUser", purchaseUserId: id, product: { userId: { not: id } } },
              { role: "purchaseUser", sellUserId: id, product: { userId: { equals: id } } },
            ],
          }
        : {}),
      ...(filter === "purchaseUser" ? { OR: [{ role: "purchaseUser", sellUserId: id, product: { userId: { equals: id } } }] } : {}),
      ...(filter === "sellUser" ? { OR: [{ role: "sellUser", purchaseUserId: id, product: { userId: { not: id } } }] } : {}),
    };

    // fetch data
    const totalCount = await client.productReview.count({
      where,
    });
    const reviews = await client.productReview.findMany({
      where,
      take: pageSize,
      skip: prevCursor ? 1 : 0,
      ...(prevCursor && { cursor: { id: prevCursor } }),
      orderBy: {
        createdAt: "desc",
      },
      include: {
        purchaseUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        sellUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // result
    const result: GetProfilesReviewsResponse = {
      success: true,
      totalCount,
      lastCursor: reviews.length ? reviews[reviews.length - 1].id : -1,
      reviews: reviews.map((review) => ({ ...review, satisfaction: "", productId: 0 })),
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
