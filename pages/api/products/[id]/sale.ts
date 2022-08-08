import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostProductsSaleResponse extends ResponseDataType {
  recordSale: Record | null;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id } = req.query;
    const { sale } = req.body;
    const { user } = req.session;

    // invalid
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

    // params
    const id = +_id.toString();
    const isForcedUpdate = /\/chats\/[0-9]*$/.test(req?.headers?.referer || "");
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
    if (!isForcedUpdate && product.userId !== user?.id) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    let recordSale = null;
    const existed = product.records.length ? product.records[0] : null;

    if (existed && sale === false) {
      // delete record
      await client.record.delete({
        where: {
          id: existed.id,
        },
      });
    } else if (!existed && sale === true) {
      // delete record
      await client.record.deleteMany({
        where: {
          productId: product.id,
          kind: Kind.ProductPurchase,
        },
      });

      // delete review
      await client.productReview.deleteMany({
        where: {
          productId: product.id,
        },
      });

      // create record
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
