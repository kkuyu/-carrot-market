import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    const products = await client.product.findMany({
      include: {
        records: {
          where: {
            kind: "Favorite",
          },
          select: {
            id: true,
          },
        },
      },
    });
    if (!products) {
      res.json({
        success: true,
        products: [],
      });
    }
    res.json({
      success: true,
      products,
    });
  }
  if (req.method === "POST") {
    const { name, price, description } = req.body;
    const { user } = req.session;
    if (!name && !price && !description) {
      const error = new Error("Invalid request body");
      throw error;
    }
    const newProduct = await client.product.create({
      data: {
        imageUrl: "/favicon.ico",
        name,
        price: +price,
        description,
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    });
    return res.status(200).json({
      success: true,
      product: newProduct,
    });
  }
}

export default withSessionRoute(
  withHandler({
    methods: ["GET", "POST"],
    handler,
  })
);
