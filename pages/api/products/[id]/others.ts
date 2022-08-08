import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Product } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProductsDetailOthersResponse extends ResponseDataType {
  type: "userProducts" | "similarProducts" | "latestProducts" | "";
  otherProducts: Pick<Product, "id" | "name" | "photos" | "price">[];
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
    });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    // fetch user's other products
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
          records: { some: { kind: Kind.ProductSale } },
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

    // fetch similar product
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
          records: { some: { kind: Kind.ProductSale } },
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

    // fetch latest products
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
          records: { some: { kind: Kind.ProductSale } },
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
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
