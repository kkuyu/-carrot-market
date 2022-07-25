import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostProductsPurchaseResponse {
  success: boolean;
  recordPurchase: Record | null;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id } = req.query;
    const { purchase, purchaseUserId: _purchaseUserId } = req.body;

    // request valid
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

    // find product detail
    const id = +_id.toString();
    const product = await client.product.findUnique({
      where: {
        id,
      },
      include: {
        records: {
          where: {
            OR: [{ kind: Kind.Sale }, { kind: Kind.Purchase }],
          },
          select: {
            id: true,
            kind: true,
          },
        },
      },
    });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }
    if (product.records.find((record) => record.kind === Kind.Sale)) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    // find purchase user
    const purchaseUserId = _purchaseUserId ? +_purchaseUserId.toString() : null;
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
    const exists = product.records.find((record) => record.kind === Kind.Purchase);

    if (exists && purchase === false) {
      // delete
      await client.record.delete({
        where: {
          id: exists.id,
        },
      });
    } else if (exists && purchase === true && purchaseUser) {
      // update
      recordPurchase = await client.record.update({
        where: {
          id: exists.id,
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
          kind: Kind.Purchase,
        },
      });
    } else if (!exists && purchase === true && purchaseUser) {
      // create
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
          kind: Kind.Purchase,
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
