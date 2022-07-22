import { NextApiRequest, NextApiResponse } from "next";
import { User, Review } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export type ProfilesReviewsFilter = "ALL" | "SELL_USER" | "PURCHASE_USER";

export interface GetProfilesReviewsResponse {
  success: boolean;
  reviews: (Review & { purchaseUser?: Pick<User, "id" | "name" | "avatar">; sellUser?: Pick<User, "id" | "name" | "avatar"> })[];
  pages: number;
  total: number;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  // ONLY_COUNT
  if (req.query.type === "ONLY_COUNT") {
    const { id: _id, filter: _filter } = req.query;

    // request valid
    if (!_id || !_filter) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!(_filter === "ALL" || _filter === "SELL_USER" || _filter === "PURCHASE_USER")) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data: client.product
    const id = +_id.toString();
    const filter = _filter.toString() as ProfilesReviewsFilter;
    const reviewsFilter =
      filter === "ALL"
        ? {
            OR: [
              { role: "sellUser", purchaseUserId: id, product: { userId: { not: id } } },
              { role: "purchaseUser", sellUserId: id, product: { userId: { equals: id } } },
            ],
          }
        : filter === "SELL_USER"
        ? {
            OR: [{ role: "sellUser", purchaseUserId: id, product: { userId: { not: id } } }],
          }
        : filter === "PURCHASE_USER"
        ? {
            OR: [{ role: "purchaseUser", sellUserId: id, product: { userId: { equals: id } } }],
          }
        : {};

    const totalReviews = await client.review.count({
      where: {
        satisfaction: {
          not: "dislike",
        },
        ...reviewsFilter,
      },
    });

    // result
    const result: GetProfilesReviewsResponse = {
      success: true,
      reviews: [],
      pages: 0,
      total: totalReviews,
    };
    return res.status(200).json(result);
  }

  // DEFAULT
  try {
    const { id: _id, filter: _filter, page: _page } = req.query;

    // request valid
    if (!_id || !_filter) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!_page) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data: client.product
    const id = +_id.toString();
    const filter = _filter.toString() as ProfilesReviewsFilter;
    const displayRow = 10;
    const page = +_page.toString();
    const reviewsFilter =
      filter === "ALL"
        ? {
            OR: [
              { role: "sellUser", purchaseUserId: id, product: { userId: { not: id } } },
              { role: "purchaseUser", sellUserId: id, product: { userId: { equals: id } } },
            ],
          }
        : filter === "SELL_USER"
        ? {
            OR: [{ role: "sellUser", purchaseUserId: id, product: { userId: { not: id } } }],
          }
        : filter === "PURCHASE_USER"
        ? {
            OR: [{ role: "purchaseUser", sellUserId: id, product: { userId: { equals: id } } }],
          }
        : {};

    const totalReviews = await client.review.count({
      where: {
        satisfaction: {
          not: "dislike",
        },
        ...reviewsFilter,
      },
    });
    const reviews = await client.review.findMany({
      take: displayRow,
      skip: (page - 1) * displayRow,
      orderBy: {
        createdAt: "desc",
      },
      where: {
        satisfaction: {
          not: "dislike",
        },
        ...reviewsFilter,
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
      reviews: reviews.map((review) => ({ ...review, satisfaction: "", productId: 0 })),
      pages: Math.ceil(totalReviews / displayRow),
      total: totalReviews,
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
