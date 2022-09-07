import { NextApiRequest, NextApiResponse } from "next";
import { Chat, ChatMessage, Product, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { isInstance } from "@libs/utils";

export interface GetProductsChatsResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  chats: (Chat & {
    users: Pick<User, "id" | "name" | "avatar">[];
    chatMessages: ChatMessage[];
    product?: Pick<Product, "id" | "name" | "photos"> | null;
  })[];
}

export const ChatsFilterEnum = {
  ["all"]: "all",
  ["available"]: "available",
} as const;

export type ChatsFilterEnum = typeof ChatsFilterEnum[keyof typeof ChatsFilterEnum];

export const getProductsChats = async (query: { pageSize: number; prevCursor: number; filter: ChatsFilterEnum; userId: number; productId: number }) => {
  const { pageSize, prevCursor, filter, userId, productId } = query;

  const where = {
    productId,
    users: {
      some: {
        id: userId,
      },
    },
    ...(filter === "available"
      ? {
          updatedAt: {
            gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 1),
          },
        }
      : {}),
  };

  const totalCount = await client.chat.count({
    where,
  });

  const chats = await client.chat.findMany({
    where,
    take: pageSize,
    skip: prevCursor ? 1 : 0,
    ...(prevCursor && { cursor: { id: prevCursor } }),
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      chatMessages: {
        take: 1,
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  return { totalCount, chats };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { prevCursor: _prevCursor, filter: _filter, productId: _productId } = req.query;
    const { user } = req.session;

    // invalid
    if (!_prevCursor || !_filter || !_productId) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // early return result
    if (!user?.id) {
      // result
      const result: GetProductsChatsResponse = {
        success: false,
        totalCount: 0,
        lastCursor: 0,
        chats: [],
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
    const filter = _filter.toString() as ChatsFilterEnum;
    const productId = +_productId.toString();
    if (!isInstance(filter, ChatsFilterEnum)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (productId && isNaN(productId)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const { totalCount, chats } = await getProductsChats({ prevCursor, pageSize, filter, userId: user?.id, productId });

    // result
    const result: GetProductsChatsResponse = {
      success: true,
      totalCount,
      lastCursor: chats.length ? chats[chats.length - 1].id : -1,
      chats,
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
