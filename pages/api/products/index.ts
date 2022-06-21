import { NextApiRequest, NextApiResponse } from "next";
import { Product, Record } from "@prisma/client";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProductsResponse {
  success: boolean;
  products: (Product & { records: Pick<Record, "id">[] })[];
  pages: number;
}

export interface PostProductsResponse {
  success: boolean;
  product: Product;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    const { page } = req.query;
    const cleanPage = +page?.toString()!;

    const displayRow = 10;
    const totalPageCount = await client.product.count();
    const products = await client.product.findMany({
      take: displayRow,
      skip: (cleanPage - 1) * displayRow,
      orderBy: {
        createdAt: "desc",
      },
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
      return res.status(200).json({
        success: true,
        products: [],
        pages: 1,
      });
    }
    return res.status(200).json({
      success: true,
      products,
      pages: Math.ceil(totalPageCount / displayRow),
    });
  }
  if (req.method === "POST") {
    const { name, price, description, photoId } = req.body;
    const { user } = req.session;
    if (!name && !price && !description) {
      const error = new Error("Invalid request body");
      throw error;
    }
    const newProduct = await client.product.create({
      data: {
        photo: photoId,
        name,
        price,
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
