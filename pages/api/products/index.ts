import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record } from "@prisma/client";
// @libs
import { getProductCategory } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProductsResponse {
  success: boolean;
  products: (Product & { records: Pick<Record, "id" | "kind" | "userId">[]; chats?: (Chat & { _count: { chatMessages: number } })[] })[];
  pages: number;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

export interface PostProductsResponse {
  success: boolean;
  product: Product;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    try {
      const { page: _page, posX: _posX, posY: _posY, distance: _distance } = req.query;

      // request valid
      if (!_page) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!_posX || !_posY || !_distance) {
        const result: GetProductsResponse = {
          success: true,
          products: [],
          pages: 1,
        };
        return res.status(200).json(result);
      }

      // get data props
      const displayRow = 10;
      const page = +_page.toString();
      const posX = +_posX.toString();
      const posY = +_posY.toString();
      const distance = +_distance.toString();
      const boundaryArea = {
        emdPosX: { gte: posX - distance, lte: posX + distance },
        emdPosY: { gte: posY - distance, lte: posY + distance },
      };

      // fetch data: client.product
      const totalProducts = await client.product.count({
        where: {
          ...boundaryArea,
          records: { some: { kind: Kind.ProductSale } },
        },
      });
      const products = await client.product.findMany({
        take: displayRow,
        skip: (page - 1) * displayRow,
        orderBy: {
          resumeAt: "desc",
        },
        include: {
          records: {
            where: {
              OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductLike }],
            },
            select: {
              id: true,
              kind: true,
              userId: true,
            },
          },
          chats: {
            include: {
              _count: {
                select: {
                  chatMessages: true,
                },
              },
            },
          },
        },
        where: {
          ...boundaryArea,
          records: {
            some: { kind: Kind.ProductSale },
          },
        },
      });

      // result
      const result: GetProductsResponse = {
        success: true,
        products,
        pages: Math.ceil(totalProducts / displayRow),
      };
      return res.status(200).json(result);
    } catch (error: unknown) {
      // error
      if (error instanceof Error) {
        const result = {
          success: false,
          error: {
            timestamp: Date.now().toString(),
            name: error.name,
            message: error.message,
          },
        };
        return res.status(422).json(result);
      }
    }
  }
  if (req.method === "POST") {
    try {
      const { photos = [], name, category, price, description, emdAddrNm, emdPosNm, emdPosX, emdPosY } = req.body;
      const { user } = req.session;

      // request valid
      if (!name && !category && !price && !description) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (photos && !Array.isArray(photos)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!getProductCategory(category)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!emdAddrNm || !emdPosNm || !emdPosX || !emdPosY) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // create new product
      const newProduct = await client.product.create({
        data: {
          photos: photos.join(","),
          name,
          category,
          price,
          description,
          emdAddrNm,
          emdPosNm,
          emdPosX,
          emdPosY,
          resumeAt: new Date(),
          user: {
            connect: {
              id: user?.id,
            },
          },
        },
      });

      // create new record
      await client.record.create({
        data: {
          user: {
            connect: {
              id: user?.id,
            },
          },
          product: {
            connect: {
              id: newProduct.id,
            },
          },
          kind: Kind.ProductSale,
        },
      });

      // result
      const result: PostProductsResponse = {
        success: true,
        product: newProduct,
      };
      return res.status(200).json(result);
    } catch (error: unknown) {
      // error
      if (error instanceof Error) {
        const result = {
          success: false,
          error: {
            timestamp: Date.now().toString(),
            name: error.name,
            message: error.message,
          },
        };
        return res.status(422).json(result);
      }
    }
  }
}

export default withSessionRoute(
  withHandler({
    methods: [
      { type: "GET", isPrivate: false },
      { type: "POST", isPrivate: true },
    ],
    handler,
  })
);
