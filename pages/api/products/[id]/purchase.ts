import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostProductsPurchaseResponse extends ResponseDataType {
  recordPurchase: Record | null;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id } = req.query;
    const { purchase, purchaseUserId: _purchaseUserId } = req.body;

    // invalid
    if (!_id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (typeof purchase !== "boolean") {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (purchase === true && !_purchaseUserId) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const id = +_id.toString();
    const purchaseUserId = _purchaseUserId ? +_purchaseUserId.toString() : 0;
    if (isNaN(id) || isNaN(purchaseUserId)) {
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
    if (product.records.find((record) => record.kind === Kind.ProductSale)) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    // fetch purchase user
    const purchaseUser = purchaseUserId
      ? await client.user.findUnique({
          where: {
            id: purchaseUserId,
          },
          select: {
            id: true,
          },
        })
      : null;
    if (purchaseUserId && !purchaseUser) {
      const error = new Error("NotFoundUser");
      error.name = "NotFoundUser";
      throw error;
    }

    let recordPurchase = null;
    const existed = product.records.find((record) => record.kind === Kind.ProductPurchase);

    // delete record
    if (existed && purchase === false) {
      await client.record.delete({
        where: {
          id: existed.id,
        },
      });
    }

    // update record
    if (existed && purchase === true && purchaseUser) {
      recordPurchase = await client.record.update({
        where: {
          id: existed.id,
        },
        data: {
          user: {
            connect: {
              id: purchaseUser.id,
            },
          },
          product: {
            connect: {
              id: product.id,
            },
          },
          kind: Kind.ProductPurchase,
        },
      });
    }

    // create record
    if (!existed && purchase === true && purchaseUser) {
      recordPurchase = await client.record.create({
        data: {
          user: {
            connect: {
              id: purchaseUser.id,
            },
          },
          product: {
            connect: {
              id: product.id,
            },
          },
          kind: Kind.ProductPurchase,
        },
      });
    }

    // result
    const result: PostProductsPurchaseResponse = {
      success: true,
      recordPurchase,
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
