import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Manner, MannerValue, Review } from "@prisma/client";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostProductsDetailReviewResponse extends ResponseDataType {
  review: Review | null;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { role, id: _id, score: _score, manners = [], description, purchaseUserId: _purchaseUserId, sellUserId: _sellUserId } = req.body;

    // invalid
    if (!role || !_id || !_score || !manners.length || !_purchaseUserId || !_sellUserId) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (role !== "sellUser" && role !== "purchaseUser") {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const id = +_id.toString();
    const sellUserId = +_sellUserId.toString();
    const purchaseUserId = +_purchaseUserId.toString();
    const score = +_score.toString();
    if (isNaN(id) || isNaN(sellUserId) || isNaN(purchaseUserId) || isNaN(score)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (manners.map((manner: string) => isInstance(manner, MannerValue)).includes(false)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch purchase user
    const purchaseUser = await client.user.findUnique({
      where: {
        id: purchaseUserId,
      },
      select: {
        id: true,
        manners: true,
      },
    });
    if (!purchaseUser) {
      const error = new Error("NotFoundUser");
      error.name = "NotFoundUser";
      throw error;
    }

    // fetch sell user
    const sellUser = await client.user.findUnique({
      where: {
        id: sellUserId,
      },
      select: {
        id: true,
        manners: true,
      },
    });
    if (!sellUser) {
      const error = new Error("NotFoundUser");
      error.name = "NotFoundUser";
      throw error;
    }

    // fetch product
    const product = await client.product.findUnique({
      where: {
        id,
      },
      include: {
        records: {
          select: {
            id: true,
            kind: true,
          },
        },
        reviews: true,
      },
    });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }
    if (product.records.find((record) => record.kind === Kind.ProductSale) || !product.records.find((record) => record.kind === Kind.ProductPurchase)) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }
    if (product.reviews.find((review) => review.role === role && review.sellUserId === sellUser.id && review.purchaseUserId === purchaseUser.id)) {
      const error = new Error("ExistedReview");
      error.name = "ExistedReview";
      throw error;
    }

    // create product review
    const newReview = await client.review.create({
      data: {
        role,
        score,
        description,
        sellUser: {
          connect: {
            id: sellUser.id,
          },
        },
        purchaseUser: {
          connect: {
            id: purchaseUser.id,
          },
        },
        product: {
          connect: {
            id: product.id,
          },
        },
      },
    });

    const reviewTarget = newReview.role === "sellUser" ? purchaseUser : sellUser;

    await client.$transaction(
      manners.map((manner: MannerValue) =>
        client.manner.upsert({
          where: {
            id: reviewTarget?.manners?.find((existed: Manner) => existed.value === manner)?.id || 0,
          },
          update: {
            reviews: {
              connect: {
                id: newReview.id,
              },
            },
          },
          create: {
            value: manner,
            reviews: {
              connect: {
                id: newReview.id,
              },
            },
            user: {
              connect: {
                id: reviewTarget.id,
              },
            },
          },
        })
      )
    );

    // result
    const result: PostProductsDetailReviewResponse = {
      success: true,
      review: newReview,
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
    methods: [{ type: "POST", isPrivate: true }],
    handler,
  })
);
