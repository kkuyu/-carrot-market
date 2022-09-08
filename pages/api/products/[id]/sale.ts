import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostProductsSaleResponse extends ResponseDataType {
  recordSale: Record | null;
  purchaseUserId?: number;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id } = req.query;
    const { sale, purchase, purchaseUserId: _purchaseUserId } = req.body;
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
    if (purchase && typeof purchase !== "boolean") {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (purchase && purchase === true && !_purchaseUserId) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const id = +_id.toString();
    const purchaseUserId = _purchaseUserId ? +_purchaseUserId.toString() : null;
    if (isNaN(id)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (purchaseUserId && isNaN(purchaseUserId)) {
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
        records: true,
      },
    });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }
    if (product.userId !== user?.id && purchaseUserId !== user?.id) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    let recordSale = null;
    const existed = product.records.find((record) => record.kind === Kind.ProductSale) || null;

    // delete
    if (existed && sale === false) {
      await client.record.delete({
        where: {
          id: existed.id,
        },
      });
    }

    // update record, productReview
    if (!existed && sale === true) {
      await client.record.deleteMany({
        where: {
          productId: product.id,
          kind: Kind.ProductPurchase,
        },
      });
      await client.productReview.deleteMany({
        where: {
          productId: product.id,
        },
      });
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
      ...(purchaseUserId ? { purchaseUserId } : {}),
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
