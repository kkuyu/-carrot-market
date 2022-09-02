import { NextApiRequest, NextApiResponse } from "next";
import { Kind, ProductReview } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostReviewsResponse extends ResponseDataType {
  review: ProductReview | null;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { role, satisfaction, manners = [], text, purchaseUserId: _purchaseUserId, sellUserId: _sellUserId, productId: _productId } = req.body;
    const { user } = req.session;

    // invalid
    if (!role || !satisfaction || !manners.length || !_purchaseUserId || !_sellUserId) {
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
    const sellUserId = +_sellUserId.toString();
    const purchaseUserId = +_purchaseUserId.toString();
    const productId = +_productId.toString();
    if (isNaN(sellUserId) || isNaN(purchaseUserId) || isNaN(productId)) {
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
        id: productId,
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
    if (product.records.find((record) => record.kind === Kind.ProductSale)) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }
    if (!product.records.find((record) => record.kind === Kind.ProductPurchase)) {
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
    const newReview = await client.productReview.create({
      data: {
        role,
        satisfaction,
        text,
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

    for (let index = 0; index < manners.length; index++) {
      const reviewTarget = newReview.role === "sellUser" ? purchaseUser : sellUser;
      const existed = reviewTarget.manners.find((manner) => manner.value === manners[index]);
      if (existed) {
        // update manner
        await client.manner.update({
          where: {
            id: existed.id,
          },
          data: {
            reviews: {
              connect: {
                id: newReview.id,
              },
            },
          },
        });
      } else {
        // create manner
        await client.manner.create({
          data: {
            value: manners[index],
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
        });
      }
    }

    // result
    const result: PostReviewsResponse = {
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
