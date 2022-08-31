import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record, ProductReview, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProductsDetailResponse extends ResponseDataType {
  product: Product & {
    user: Pick<User, "id" | "name" | "avatar">;
    records: Pick<Record, "id" | "kind" | "userId">[];
    chats: (Chat & { _count: { chatMessages: number } })[];
    reviews: Pick<ProductReview, "id" | "role" | "sellUserId" | "purchaseUserId">[];
  };
  role?: {
    myRole: "sellUser" | "purchaseUser";
    partnerRole: "sellUser" | "purchaseUser";
  };
  productCondition?: {
    likes?: number;
    chats?: number;
    isSale?: boolean;
    isPurchase?: boolean;
    sentReviewId?: number | null;
    receiveReviewId?: number | null;
  };
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
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    // condition
    const myRole = user?.id && user?.id === product?.userId ? "sellUser" : "purchaseUser";
    const partnerRole = user?.id && myRole !== "sellUser" ? "sellUser" : "purchaseUser";
    const productCondition = {
      likes: product?.records?.filter((record) => record.kind === Kind.ProductLike).length,
      chats: product?.chats?.filter((chat) => chat._count.chatMessages > 0).length,
      isSale: Boolean(product?.records?.find((record) => record.kind === Kind.ProductSale)),
      isPurchase: Boolean(product?.records?.find((record) => record.kind === Kind.ProductPurchase)),
      sentReviewId: (myRole && product?.reviews?.find((review) => review.role === myRole && review[`${myRole}Id`] === user?.id)?.id) || null,
      receiveReviewId: (myRole && product?.reviews?.find((review) => review.role === partnerRole && review[`${myRole}Id`] === user?.id)?.id) || null,
    };

    // result
    const result: GetProductsDetailResponse = {
      success: true,
      product,
      role: { myRole, partnerRole },
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
