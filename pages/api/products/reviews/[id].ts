import { NextApiRequest, NextApiResponse } from "next";
import { User, Review, Manner } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProductsReviewsDetailResponse extends ResponseDataType {
  review: Review & {
    sellUser: Pick<User, "id" | "name" | "avatar">;
    purchaseUser: Pick<User, "id" | "name" | "avatar">;
    manners: Manner[];
  };
}

export const getProductsReviewsDetail = async (query: { id: number; userId: number }) => {
  const { id, userId } = query;

  const review = await client.review.findFirst({
    where: {
      id,
      OR: [
        { role: "sellUser", sellUserId: userId },
        { role: "sellUser", purchaseUserId: userId, score: { gt: 40 } },
        { role: "purchaseUser", purchaseUserId: userId },
        { role: "purchaseUser", sellUserId: userId, score: { gt: 40 } },
      ],
    },
    include: {
      sellUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      purchaseUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      manners: true,
    },
  });

  return { review };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id } = req.query;
    const { user } = req.session;

    // invalid
    if (!_id || !user?.id) {
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

    const { review } = await getProductsReviewsDetail({ id, userId: user?.id });
    if (!review) {
      const error = new Error("NotFoundReview");
      error.name = "NotFoundReview";
      throw error;
    }

    // result
    const result: GetProductsReviewsDetailResponse = {
      success: true,
      review,
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
