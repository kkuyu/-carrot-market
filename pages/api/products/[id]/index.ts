import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record, Review, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProductsDetailResponse {
  success: boolean;
  product: Product & { user: Pick<User, "id" | "name" | "avatar">; records: Pick<Record, "id" | "kind" | "userId">[]; chats: (Chat & { _count: { chatMessages: number } })[]; reviews: Review[] };
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

    // find product detail
    const id = +_id.toString();
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
          where: {
            OR: [{ kind: Kind.Sale }, { kind: Kind.Favorite }, { kind: Kind.Purchase }],
          },
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
        reviews: true,
      },
    });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    // result
    const result: GetProductsDetailResponse = {
      success: true,
      product,
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
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
