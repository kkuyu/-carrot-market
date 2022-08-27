import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, ProductCategory, Record } from "@prisma/client";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProductsResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  products: (Product & { records: Pick<Record, "id" | "kind" | "userId">[]; chats?: (Chat & { _count: { chatMessages: number } })[] })[];
}

export interface PostProductsResponse extends ResponseDataType {
  product: Product;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  if (req.method === "GET") {
    try {
      const { prevCursor: _prevCursor, posX: _posX, posY: _posY, distance: _distance, category: _category } = req.query;

      // invalid
      if (!_prevCursor) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (_category && !isInstance(_category.toString(), ProductCategory)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // early return result
      if (!_posX || !_posY || !_distance) {
        const result: GetProductsResponse = {
          success: false,
          totalCount: 0,
          lastCursor: 0,
          products: [],
        };
        return res.status(200).json(result);
      }

      // page
      const prevCursor = +_prevCursor.toString();
      const pageSize = 10;
      if (isNaN(prevCursor) || prevCursor === -1) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // params
      const category = (_category ? _category?.toString() : null) as ProductCategory | null;
      const posX = +_posX.toString();
      const posY = +_posY.toString();
      const distance = +_distance.toString();
      const boundaryArea = {
        emdPosX: { gte: posX - distance, lte: posX + distance },
        emdPosY: { gte: posY - distance, lte: posY + distance },
      };
      if (isNaN(posX) || isNaN(posY) || isNaN(distance)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // search
      const where = {
        ...boundaryArea,
        ...(category ? { category } : {}),
        records: { some: { kind: Kind.ProductSale } },
      };

      // fetch data
      const totalCount = await client.product.count({
        where,
      });
      const products = await client.product.findMany({
        where,
        take: pageSize,
        skip: prevCursor ? 1 : 0,
        ...(prevCursor && { cursor: { id: prevCursor } }),
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
      });

      // result
      const result: GetProductsResponse = {
        success: true,
        totalCount,
        lastCursor: products.length ? products[products.length - 1].id : -1,
        products,
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

      // invalid
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
      if (!isInstance(category, ProductCategory)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!emdAddrNm || !emdPosNm || !emdPosX || !emdPosY) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // create product
      const newProduct = await client.product.create({
        data: {
          photos: photos.join(";"),
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

      // create record
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
