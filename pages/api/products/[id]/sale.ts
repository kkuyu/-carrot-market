import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostProductsSaleResponse {
  success: boolean;
  recordSale: Record | null;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id } = req.query;
    const { sale } = req.body;
    const { user } = req.session;

    // request valid
    if (!_id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (typeof sale !== "boolean") {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // find product detail
    const id = +_id.toString();
    const isForcedHeader = /\/chats\/[0-9]*$/.test(req?.headers?.referer || "");
    const product = await client.product.findUnique({
      where: {
        id,
      },
      include: {
        records: {
          where: {
            kind: Kind.ProductSale,
          },
          select: {
            id: true,
          },
        },
      },
    });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }
    if (!isForcedHeader && product.userId !== user?.id) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    let recordSale = null;
    const exists = product.records.length ? product.records[0] : null;

    if (exists && sale === false) {
      // delete
      await client.record.delete({
        where: {
          id: exists.id,
        },
      });
    } else if (!exists && sale === true) {
      // delete record Kind.ProductPurchase
      await client.record.deleteMany({
        where: {
          productId: product.id,
          kind: Kind.ProductPurchase,
        },
      });

      // delete review
      await client.review.deleteMany({
        where: {
          productId: product.id,
        },
      });

      // create
      recordSale = await client.record.create({
        data: {
          user: {
            connect: {
              id: user?.id,
            },
          },
          product: {
            connect: {
              id: product.id,
            },
          },
          kind: Kind.ProductSale,
        },
      });
    }

    // result
    const result: PostProductsSaleResponse = {
      success: true,
      recordSale,
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
    methods: [{ type: "POST", isPrivate: true }],
    handler,
  })
);
