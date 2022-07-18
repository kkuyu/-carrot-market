import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record, Review, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProductsDetailOthersResponse {
  success: boolean;
  type: "userProducts" | "similarProducts" | "latestProducts" | "";
  otherProducts: Pick<Product, "id" | "name" | "photos" | "price">[];
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

    // find user's other products
    const userProducts = await client.product.findMany({
      take: 4,
      orderBy: {
        resumeAt: "desc",
      },
      select: {
        id: true,
        name: true,
        photos: true,
        price: true,
      },
      where: {
        AND: {
          userId: user?.id,
          id: { not: product.id },
          records: { some: { kind: Kind.Sale } },
        },
      },
    });
    if (userProducts.length) {
      // result
      const result: GetProductsDetailOthersResponse = {
        success: true,
        type: "userProducts",
        otherProducts: userProducts,
      };
      return res.status(200).json(result);
    }

    // find similar product
    const similarProducts = await client.product.findMany({
      take: 4,
      orderBy: {
        resumeAt: "desc",
      },
      select: {
        id: true,
        name: true,
        photos: true,
        price: true,
      },
      where: {
        OR: product.name.split(" ").map((word) => ({
          name: { contains: word },
        })),
        AND: {
          id: { not: product.id },
          records: { some: { kind: Kind.Sale } },
        },
      },
    });
    if (similarProducts.length) {
      // result
      const result: GetProductsDetailOthersResponse = {
        success: true,
        type: "similarProducts",
        otherProducts: similarProducts,
      };
      return res.status(200).json(result);
    }

    // find latest products
    const latestProducts = await client.product.findMany({
      take: 4,
      orderBy: {
        resumeAt: "desc",
      },
      select: {
        id: true,
        name: true,
        photos: true,
        price: true,
      },
      where: {
        AND: {
          id: { not: product.id },
          records: { some: { kind: Kind.Sale } },
        },
      },
    });
    if (latestProducts.length) {
      // result
      const result: GetProductsDetailOthersResponse = {
        success: true,
        type: "latestProducts",
        otherProducts: latestProducts,
      };
      return res.status(200).json(result);
    }

    // result
    const result: GetProductsDetailOthersResponse = {
      success: true,
      type: "",
      otherProducts: [],
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
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
