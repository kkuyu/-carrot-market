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
    users: Pick<User, "id" | "name" | "photos">[];
    chatMessages: ChatMessage[];
    product?: Pick<Product, "id" | "name" | "photos"> | null;
  })[];
}

export const ChatsFilterEnum = {
  ["all"]: "all",
  ["available"]: "available",
} as const;

export type ChatsFilterEnum = typeof ChatsFilterEnum[keyof typeof ChatsFilterEnum];

export const getProductsChats = async (query: { filter: ChatsFilterEnum; id: number; prevCursor: number; userId: number }) => {
  const { filter, id, prevCursor, userId } = query;

  const where = {
    productId: id,
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
    take: 10,
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
          photos: true,
        },
      },
      chatMessages: {
        take: 2,
        orderBy: {
          updatedAt: "desc",
        },
      },
      _count: {
        select: {
          chatMessages: true,
        },
      },
    },
  });

  return {
    totalCount,
    chats: chats.filter((chat) => chat._count.chatMessages > 0),
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { filter: _filter, id: _id, prevCursor: _prevCursor } = req.query;
    const { user } = req.session;

    // invalid
    if (!_prevCursor || !_filter || !_id) {
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
    if (isNaN(prevCursor) || prevCursor === -1) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const filter = _filter.toString() as ChatsFilterEnum;
    const id = +_id.toString();
    if (!isInstance(filter, ChatsFilterEnum)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (id && isNaN(id)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const { totalCount, chats } = await getProductsChats({ filter, id, prevCursor, userId: user?.id });

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
