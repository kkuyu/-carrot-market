import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Product } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export const RecommendsTypeEnum = {
  ["User"]: "User",
  ["Similar"]: "Similar",
  ["Latest"]: "Latest",
} as const;

export type RecommendsTypeEnum = typeof RecommendsTypeEnum[keyof typeof RecommendsTypeEnum];

export interface GetProductsDetailRecommendsResponse extends ResponseDataType {
  type: RecommendsTypeEnum | null;
  products: Pick<Product, "id" | "name" | "photos" | "price">[];
}

export const getProductsDetailRecommends = async (params: { id: number }) => {
  const { id } = params;

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
        userId: product?.id,
        id: { not: product.id },
        records: { some: { kind: Kind.ProductSale } },
      },
    },
  });
  if (userProducts.length) {
    return {
      type: RecommendsTypeEnum.User,
      products: userProducts,
    };
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
      OR: [
        ...product.name.split(" ").map((word) => ({
          name: { contains: word },
        })),
      ],
      AND: {
        id: { not: product.id },
        records: { some: { kind: Kind.ProductSale } },
      },
    },
  });
  if (similarProducts.length) {
    return {
      type: RecommendsTypeEnum.Similar,
      products: similarProducts,
    };
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
    return {
      type: RecommendsTypeEnum.Latest,
      products: latestProducts,
    };
  }

  return {
    type: null,
    products: [],
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id } = req.query;

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
    const { type, products } = await getProductsDetailRecommends({ id });

    // result
    const result: GetProductsDetailRecommendsResponse = {
      success: true,
      type,
      products,
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
