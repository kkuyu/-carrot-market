import { NextApiRequest, NextApiResponse } from "next";
import { User, ProductReview } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProfilesReviewsResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  reviews: (ProductReview & { purchaseUser?: Pick<User, "id" | "name" | "avatar">; sellUser?: Pick<User, "id" | "name" | "avatar"> })[];
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id, prevCursor: _prevCursor } = req.query;

    // invalid
    if (!_id || !_prevCursor) {
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
    if (isNaN(id)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // search
    const where = {
      OR: [
        { role: "sellUser", purchaseUserId: id, product: { userId: { not: id } } },
        { role: "purchaseUser", sellUserId: id, product: { userId: { equals: id } } },
      ],
      satisfaction: {
        not: "dislike",
      },
      text: {
        not: "",
      },
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
