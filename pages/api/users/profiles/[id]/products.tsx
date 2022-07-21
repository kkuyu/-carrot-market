import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record, Review } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export type ProfilesProductsFilter = "ALL" | "SALE" | "SOLD";

export interface GetProfilesProductsResponse {
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
  // ONLY_COUNT
  if (req.query.type === "ONLY_COUNT") {
    const { id: _id, filter: _filter } = req.query;

    // request valid
    if (!_id || !_filter) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!(_filter === "ALL" || _filter === "SALE" || _filter === "SOLD")) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data: client.product
    const id = +_id.toString();
    const filter = _filter.toString() as ProfilesProductsFilter;
    const recordsFilter =
      filter === "ALL"
        ? {}
        : filter === "SALE"
        ? {
            AND: { records: { some: { kind: Kind.Sale } } },
          }
        : filter === "SOLD"
        ? {
            NOT: { records: { some: { kind: Kind.Sale } } },
          }
        : {};

    const totalProducts = await client.product.count({
      where: {
        userId: id,
        ...recordsFilter,
      },
    });

    // result
    const result: GetProfilesProductsResponse = {
      success: true,
      products: [],
      pages: 0,
      total: totalProducts,
    };
    return res.status(200).json(result);
  }

  // DEFAULT
  try {
    const { id: _id, filter: _filter, page: _page } = req.query;

    // request valid
    if (!_id || !_filter) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!_page) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data: client.product
    const id = +_id.toString();
    const filter = _filter.toString() as ProfilesProductsFilter;
    const displayRow = 10;
    const page = +_page.toString();
    const recordsFilter =
      filter === "ALL"
        ? {}
        : filter === "SALE"
        ? {
            AND: { records: { some: { kind: Kind.Sale } } },
          }
        : filter === "SOLD"
        ? {
            NOT: { records: { some: { kind: Kind.Sale } } },
          }
        : {};

    const totalProducts = await client.product.count({
      where: {
        userId: id,
        ...recordsFilter,
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
      where: {
        userId: id,
        ...recordsFilter,
      },
    });

    // result
    const result: GetProfilesProductsResponse = {
      success: true,
      products,
      pages: Math.ceil(totalProducts / displayRow),
      total: totalProducts,
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

export default withSessionRoute(
  withHandler({
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
