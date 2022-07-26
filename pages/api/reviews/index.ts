import { NextApiRequest, NextApiResponse } from "next";
import { Kind, ProductReview } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostReviewsResponse {
  success: boolean;
  review: ProductReview | null;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { role, satisfaction, manners = [], text, purchaseUserId: _purchaseUserId, sellUserId: _sellUserId, productId: _productId } = req.body;
    const { user } = req.session;

    // request valid
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

    const sellUserId = +_sellUserId.toString();
    const purchaseUserId = +_purchaseUserId.toString();
    const productId = +_productId.toString();

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

    const product = await client.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        records: {
          where: {
            OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductPurchase }],
          },
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

    let newReview = null;
    const exists = product.reviews.find((review) => review.role === role && review.sellUserId === sellUser.id && review.purchaseUserId === purchaseUser.id);

    if (exists) {
      const error = new Error("ExistsReview");
      error.name = "ExistsReview";
      throw error;
    }

    // create
    newReview = await client.productReview.create({
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

    const mannerUser = newReview.role === "sellUser" ? purchaseUser : sellUser;
    for (let index = 0; index < manners.length; index++) {
      const exists = mannerUser.manners.find((manner) => manner.value === manners[index]);
      if (exists) {
        await client.manner.update({
          where: {
            id: exists.id,
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
                id: mannerUser.id,
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
