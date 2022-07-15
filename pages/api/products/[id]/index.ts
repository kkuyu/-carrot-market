import { NextApiRequest, NextApiResponse } from "next";
import { Kind, Product, Record, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProductsDetailResponse {
  success: boolean;
  product: Product & { user: Pick<User, "id" | "name" | "avatar">; records: Pick<Record, "id" | "kind" | "userId">[] };
  isFavorite: boolean;
  otherProducts: Pick<Product, "id" | "name" | "photos" | "price">[];
  similarProducts: Pick<Product, "id" | "name" | "photos" | "price">[];
  latestProducts: Pick<Product, "id" | "name" | "photos" | "price">[];
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        records: {
          where: {
            OR: [{ kind: Kind.Sale }, { kind: Kind.Favorite }],
          },
          select: {
            id: true,
            kind: true,
            userId: true,
          },
        },
      },
    });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    // find user's other products
    const otherProducts = await client.product.findMany({
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

    // find similar product
    const similarProducts = otherProducts.length
      ? []
      : await client.product.findMany({
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

    // find latest products
    const latestProducts = otherProducts.length
      ? []
      : similarProducts.length
      ? []
      : await client.product.findMany({
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

    // result
    const result: GetProductsDetailResponse = {
      success: true,
      product,
      isFavorite: !user?.id ? false : Boolean(product.records.find((record) => record.kind === "Favorite" && record.userId === user.id)),
      otherProducts,
      similarProducts,
      latestProducts,
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
