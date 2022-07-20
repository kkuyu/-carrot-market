import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record, Review } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProfilesFavoritesResponse {
  success: boolean;
  products: (Product & { records: Pick<Record, "id" | "kind" | "userId">[]; chats?: (Chat & { _count: { chatMessages: number } })[]; reviews: Review[] })[];
  pages: number;
  total: number;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (!req.query.page) {
    const { user } = req.session;

    // fetch data: client.record
    const totalRecords = await client.record.count({
      where: {
        userId: user?.id,
        kind: Kind.Purchase,
      },
    });

    // result
    const result: GetProfilesFavoritesResponse = {
      success: true,
      products: [],
      pages: 0,
      total: totalRecords,
    };
    return res.status(200).json(result);
  } else {
    try {
      const { page: _page } = req.query;
      const { user } = req.session;

      // request valid
      if (!_page) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // fetch data: client.product
      const displayRow = 10;
      const page = +_page.toString();

      const totalRecords = await client.record.count({
        where: {
          userId: user?.id,
          kind: Kind.Purchase,
        },
      });
      const records = await client.record.findMany({
        take: displayRow,
        skip: (page - 1) * displayRow,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          product: {
            include: {
              records: {
                where: {
                  OR: [{ kind: Kind.Sale }, { kind: Kind.Favorite }, { kind: Kind.Purchase }],
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
              reviews: true,
            },
          },
        },
        where: {
          userId: user?.id,
          kind: Kind.Favorite,
        },
      });
      const products = records.map((record) => record.product);

      // result
      const result: GetProfilesFavoritesResponse = {
        success: true,
        products,
        pages: Math.ceil(totalRecords / displayRow),
        total: totalRecords,
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
    methods: [{ type: "GET", isPrivate: true }],
    handler,
  })
);
