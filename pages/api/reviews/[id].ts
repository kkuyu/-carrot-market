import { NextApiRequest, NextApiResponse } from "next";
import { Product, User, Review, Manner } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

type ReviewUser = Pick<User, "id" | "name">;
type ReviewProduct = Pick<Product, "id" | "name" | "userId"> & { reviews: Pick<Review, "id" | "role" | "satisfaction">[] };

export interface GetReviewsDetailResponse {
  success: boolean;
  review: Review & { sellUser: ReviewUser; purchaseUser: ReviewUser; manners: Manner[] } & { product: ReviewProduct };
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id } = req.query;
    const { user } = req.session;

    // request valid
    if (!_id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // find chat detail
    const id = +_id.toString();
    const review = await client.review.findUnique({
      where: {
        id,
      },
      include: {
        manners: true,
        purchaseUser: {
          select: {
            id: true,
            name: true,
          },
        },
        sellUser: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            userId: true,
            reviews: {
              where: {
                NOT: [{ id }],
              },
              select: {
                id: true,
                role: true,
                satisfaction: true,
              },
            },
          },
        },
      },
    });
    if (!review) {
      const error = new Error("NotFoundReview");
      error.name = "NotFoundReview";
      throw error;
    }
    const role = user?.id === review.product?.userId ? "sellUser" : "purchaseUser";
    if (!(review.sellUser.id === user?.id || review.purchaseUser.id === user?.id)) {
      const error = new Error("NotFoundReview");
      error.name = "NotFoundReview";
      throw error;
    }
    if (review.role !== role && review.satisfaction === "dislike") {
      const error = new Error("NotFoundReview");
      error.name = "NotFoundReview";
      throw error;
    }
    if (review.product.reviews.length) {
      const receiveReview = review.product.reviews[0];
      if (receiveReview.role !== role && receiveReview.satisfaction === "dislike") {
        review.product.reviews = [];
      }
    }

    // result
    const result: GetReviewsDetailResponse = {
      success: true,
      review,
    };
    return res.status(200).json(result);
  } catch (error: unknown) {
    // error
    if (error instanceof Error) {
      const date = Date.now().toString();
      return res.status(422).json({
        success: false,
        error: {
          timestamp: date,
          name: error.name,
          message: error.message,
        },
      });
    }
  }
}

export default withSessionRoute(
  withHandler({
    methods: [{ type: "GET", isPrivate: true }],
    handler,
  })
);
