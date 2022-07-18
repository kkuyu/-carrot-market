import { NextApiRequest, NextApiResponse } from "next";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostProductsDeleteResponse {
  success: boolean;
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
    });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }
    if (product.userId !== user?.id) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    // remove review
    await client.review.deleteMany({
      where: {
        productId: product.id,
      },
    });

    // remove record
    await client.record.deleteMany({
      where: {
        productId: product.id,
      },
    });

    // remove chat
    await client.chat.deleteMany({
      where: {
        productId: product.id,
      },
    });

    // remove product
    await client.product.delete({
      where: {
        id: product.id,
      },
    });

    // result
    const result: PostProductsDeleteResponse = {
      success: true,
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
