import { NextApiRequest, NextApiResponse } from "next";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostProductsDeleteResponse extends ResponseDataType {}

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
      select: {
        id: true,
        userId: true,
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

    // delete product review
    await client.productReview.deleteMany({
      where: {
        productId: product.id,
      },
    });

    // delete record
    await client.record.deleteMany({
      where: {
        productId: product.id,
      },
    });

    // delete chat message
    await client.chatMessage.deleteMany({
      where: {
        chat: {
          productId: product.id,
        },
      },
    });

    // delete chat
    await client.chat.deleteMany({
      where: {
        productId: product.id,
      },
    });

    // delete product
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
    methods: [{ type: "POST", isPrivate: true }],
    handler,
  })
);
