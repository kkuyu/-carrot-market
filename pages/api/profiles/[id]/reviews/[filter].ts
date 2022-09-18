import { NextApiRequest, NextApiResponse } from "next";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { GetProfilesModelsResponse } from "@api/profiles/[id]/[models]/[filter]";

export type GetProfilesReviewsResponse = Pick<GetProfilesModelsResponse, "success" | "totalCount" | "lastCursor" | "reviews">;

export const ProfileReviewsEnum = {
  ["all"]: "all",
  ["preview"]: "preview",
  ["purchaseUser"]: "purchaseUser",
  ["sellUser"]: "sellUser",
} as const;

export type ProfileReviewsEnum = typeof ProfileReviewsEnum[keyof typeof ProfileReviewsEnum];

export const getProfilesReviews = async (query: { filter: ProfileReviewsEnum; id: number; prevCursor: number }) => {
  const { filter, id, prevCursor } = query;

  const where = {
    score: {
      gt: 40,
    },
    description: {
      not: "",
    },
    ...(filter === "all" || filter === "preview"
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

  const totalCount = await client.review.count({
    where,
  });

  const reviews = await client.review.findMany({
    where,
    take: filter === "preview" ? 3 : 10,
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
          photos: true,
        },
      },
      sellUser: {
        select: {
          id: true,
          name: true,
          photos: true,
        },
      },
    },
  });

  return {
    totalCount,
    reviews,
  };
};

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
    const filter = _filter.toString() as ProfileReviewsEnum;
    const prevCursor = +_prevCursor.toString();
    if (!isInstance(filter, ProfileReviewsEnum)) {
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

    // fetch data
    const { totalCount, reviews } = await getProfilesReviews({ filter, id, prevCursor });

    // result
    const result: GetProfilesReviewsResponse = {
      success: true,
      totalCount,
      lastCursor: reviews.length ? reviews[reviews.length - 1].id : -1,
      reviews: reviews.map((review) => ({ ...review, score: 0, productId: 0 })),
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
