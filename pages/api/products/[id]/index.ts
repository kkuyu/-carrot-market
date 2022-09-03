import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Product, Record, ProductReview, User } from "@prisma/client";
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
  isLike: boolean;
  isSale: boolean;
  isPurchase: boolean;
}

export interface GetProductsDetailResponse extends ResponseDataType {
  product: Product & {
    user?: Pick<User, "id" | "name" | "avatar">;
    records?: Pick<Record, "id" | "kind" | "userId">[];
    chats?: (Chat & { _count: { chatMessages: number } })[];
    reviews?: Pick<ProductReview, "id" | "role" | "sellUserId" | "purchaseUserId">[];
  };
  productCondition?: ProductCondition | null;
}

export const getProductsDetail = async (query: { id: number }) => {
  const { id } = query;

  const product = await client.product.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
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
        select: {
          id: true,
          role: true,
          sellUserId: true,
          purchaseUserId: true,
        },
      },
    },
  });

  return { product };
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
    const { product } = await getProductsDetail({ id });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    // result
    const result: GetProductsDetailResponse = {
      success: true,
      product,
      productCondition: getProductCondition(product, user?.id),
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
