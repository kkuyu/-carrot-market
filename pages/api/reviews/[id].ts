import { NextApiRequest, NextApiResponse } from "next";
import { Product, User, ProductReview, Manner } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

type ReviewUser = Pick<User, "id" | "name">;
type ReviewProduct = Pick<Product, "id" | "name" | "userId"> & { reviews: Pick<ProductReview, "id" | "role" | "satisfaction">[] };

export interface GetReviewsDetailResponse extends ResponseDataType {
  review: ProductReview & { sellUser: ReviewUser; purchaseUser: ReviewUser; manners: Manner[] } & { product: ReviewProduct };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id } = req.query;
    const { user } = req.session;

    // invalid
    if (!_id) {
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
    const review = await client.productReview.findUnique({
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

    // result
    const result: GetReviewsDetailResponse = {
      success: true,
      review: {
        ...review,
        product: {
          ...review.product,
          reviews: review.product.reviews.filter((review) => review.satisfaction !== "dislike"),
        },
      },
    };
    return res.status(200).json(result);
  } catch (error: unknown) {
    // error
    if (error instanceof Error) {
      const date = Date.now().toString();
      const result = {
        success: false,
        error: {
          timestamp: date,
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
