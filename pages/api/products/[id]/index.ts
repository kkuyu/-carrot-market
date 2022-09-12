import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Product, Record, Review, User } from "@prisma/client";
// @libs
import { getProductCondition } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { ProductCategories } from "@api/products/types";

export interface ProductCondition {
  role: {
    myRole: "sellUser" | "purchaseUser" | "unrelatedUser" | "unknown";
    partnerRole: "sellUser" | "purchaseUser" | "unrelatedUser" | "unknown";
    partnerUserId: number | null;
  };
  likes: number;
  category?: ProductCategories[number] & { kebabCaseValue: string };
  chats?: number;
  review?: { sentReviewId: number | null; receiveReviewId: number | null };
  isSale: boolean;
  isPurchase: boolean;
  isLike?: boolean;
}

export interface GetProductsDetailResponse extends ResponseDataType {
  product: Product & {
    user?: Pick<User, "id" | "name" | "photos">;
    records?: Pick<Record, "id" | "kind" | "userId">[];
    chats?: (Chat & { _count: { chatMessages: number } })[];
    reviews?: Pick<Review, "id" | "role" | "sellUserId" | "purchaseUserId">[];
  };
  productCondition?: ProductCondition | null;
}

export const getProductsDetail = async (query: { id: number; userId?: number }) => {
  const { id, userId } = query;

  const product = await client.product.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          photos: true,
        },
      },
      records: {
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      chats: {
        include: {
          _count: {
            select: {
              chatMessages: true,
            },
          },
        },
      },
      reviews: {
        where: {
          OR: [
            { role: "sellUser", sellUserId: userId },
            { role: "sellUser", purchaseUserId: userId, score: { gt: 40 } },
            { role: "purchaseUser", purchaseUserId: userId },
            { role: "purchaseUser", sellUserId: userId, score: { gt: 40 } },
          ],
        },
        select: {
          id: true,
          role: true,
          sellUserId: true,
          purchaseUserId: true,
        },
      },
    },
  });

  const productCondition = getProductCondition(product, userId || null);

  return {
    product,
    productCondition,
  };
};

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
    const { product, productCondition } = await getProductsDetail({ id, userId: user?.id });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    // result
    const result: GetProductsDetailResponse = {
      success: true,
      product,
      productCondition,
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
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
