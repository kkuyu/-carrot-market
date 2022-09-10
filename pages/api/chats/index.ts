import { NextApiRequest, NextApiResponse } from "next";
import { Chat, ChatMessage, Product, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetChatsResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  chats: (Chat & {
    users: Pick<User, "id" | "name" | "avatar">[];
    chatMessages: ChatMessage[];
    product?: Pick<Product, "id" | "name" | "photos"> | null;
  })[];
}

export interface PostChatsResponse extends ResponseDataType {
  chat: Chat;
}

export const getChats = async (query: { prevCursor: number; pageSize: number; userId: number }) => {
  const { prevCursor, pageSize, userId } = query;

  const where = {
    users: {
      some: {
        id: userId,
      },
    },
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
      product: {
        select: { id: true, name: true, photos: true },
      },
      _count: {
        select: {
          chatMessages: true,
        },
      },
    },
  });

  return { totalCount, chats: chats.filter((chat) => chat._count.chatMessages > 0) };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  if (req.method === "GET") {
    try {
      const { prevCursor: _prevCursor } = req.query;
      const { user } = req.session;

      // invalid
      if (!_prevCursor) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // early return result
      if (!user?.id) {
        // result
        const result: GetChatsResponse = {
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

      // fetch data
      const { totalCount, chats } = await getChats({ prevCursor, pageSize, userId: user?.id });

      // result
      const result: GetChatsResponse = {
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
  if (req.method === "POST") {
    try {
      const { userIds = [], productId: _productId } = req.body;
      const { user } = req.session;

      // invalid
      if (!userIds.length || !userIds.find((id: number) => +id === user?.id)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // validation: user
      for (let index = 0; index < userIds.length; index++) {
        const foundUser = await client.user.findUnique({
          where: {
            id: +userIds[index],
          },
          select: {
            id: true,
          },
        });
        if (!foundUser) {
          const error = new Error("NotFoundUser");
          error.name = "NotFoundUser";
          throw error;
        }
      }

      // validation: product
      const productId = _productId ? +_productId.toString() : null;
      const product = productId
        ? await client.product.findUnique({
            where: {
              id: productId,
            },
            select: {
              id: true,
            },
          })
        : null;
      if (productId && !product) {
        const error = new Error("NotFoundProduct");
        error.name = "NotFoundProduct";
        throw error;
      }

      // fetch chat
      const existedChat = await client.chat.findFirst({
        where: {
          users: {
            every: {
              id: {
                in: userIds.sort((a: number, b: number) => a - b),
              },
            },
          },
          ...(product?.id ? { productId: product.id } : {}),
        },
      });

      // create chat
      const newChat = !existedChat
        ? await client.chat.create({
            data: {
              users: {
                connect: userIds.map((id: number) => ({ id: +id })),
              },
              ...(product?.id
                ? {
                    product: {
                      connect: {
                        id: product.id,
                      },
                    },
                  }
                : {}),
            },
          })
        : null;

      // result
      const result: PostChatsResponse = {
        success: true,
        chat: (newChat || existedChat)!,
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
