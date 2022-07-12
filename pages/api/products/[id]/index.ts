import { NextApiRequest, NextApiResponse } from "next";
import { Product, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProductsDetailResponse {
  success: boolean;
  product: Product & { user: Pick<User, "id" | "name" | "avatar"> };
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
      },
    });
    if (!product) {
      const error = new Error("NotFoundProduct");
      error.name = "NotFoundProduct";
      throw error;
    }

    // check product detail: like it or not
    const isFavorite = user?.id
      ? Boolean(
          await client.record.findFirst({
            where: {
              productId: product.id,
              userId: user.id,
              kind: "Favorite",
            },
            select: {
              id: true,
            },
          })
        )
      : false;

    // find user's other products
    const otherProducts = await client.product.findMany({
      take: 4,
      orderBy: {
        createdAt: "desc",
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
          id: {
            not: product.id,
          },
        },
      },
    });

    // find similar product
    const similarProducts = otherProducts.length
      ? []
      : await client.product.findMany({
          take: 4,
          orderBy: {
            createdAt: "desc",
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
              id: {
                not: product.id,
              },
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
            createdAt: "desc",
          },
          select: {
            id: true,
            name: true,
            photos: true,
            price: true,
          },
          where: {
            AND: {
              id: {
                not: product.id,
              },
            },
          },
        });

    // result
    const result: GetProductsDetailResponse = {
      success: true,
      product,
      isFavorite,
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
