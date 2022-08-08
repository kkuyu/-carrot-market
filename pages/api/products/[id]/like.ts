import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Record } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostProductsLikeResponse extends ResponseDataType {
  likeRecord: Record | null;
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
        records: {
          where: {
            kind: Kind.ProductLike,
            userId: user?.id,
            productId: id,
          },
        },
      },
    });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    let likeRecord = null;
    const existed = product.records.length ? product.records[0] : null;

    if (existed) {
      // delete record
      await client.record.delete({
        where: {
          id: existed.id,
        },
      });
    } else {
      // create record
      likeRecord = await client.record.create({
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
          kind: Kind.ProductLike,
        },
      });
    }

    // result
    const result: PostProductsLikeResponse = {
      success: true,
      likeRecord,
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
