import { NextApiRequest, NextApiResponse } from "next";
import { Chat, ChatMessage, Product, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetChatsResponse {
  success: boolean;
  chats: (Chat & {
    users: Pick<User, "id" | "name" | "avatar">[];
    chatMessages: ChatMessage[];
    product: Pick<Product, "id" | "name" | "photos"> | null;
  })[];
  pages: number;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

export interface PostChatsResponse {
  success: boolean;
  chat: Chat;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    try {
      const { page: _page } = req.query;
      const { user } = req.session;

      // request valid
      if (!_page) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // get data props
      const displayRow = 10;
      const page = +_page.toString();

      if (!user?.id) {
        const result: GetChatsResponse = {
          success: true,
          chats: [],
          pages: Math.ceil(0 / displayRow),
        };
        return res.status(200).json(result);
      }

      // fetch data: client.chat
      const totalChats = await client.chat.count({
        where: {
          users: {
            some: {
              id: user?.id,
            },
          },
        },
      });
      const chats = await client.chat.findMany({
        take: displayRow,
        skip: (page - 1) * displayRow,
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
            select: {
              id: true,
              name: true,
              photos: true,
            },
          },
        },
        where: {
          users: {
            some: {
              id: user?.id,
            },
          },
        },
      });

      // result
      const result: GetChatsResponse = {
        success: true,
        chats,
        pages: Math.ceil(totalChats / displayRow),
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

      // request valid
      if (!userIds.length || !userIds.find((id: number) => +id === user?.id)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // check user
      for (let index = 0; index < userIds.length; index++) {
        const user = await client.user.findUnique({
          where: {
            id: +userIds[index],
          },
          select: {
            id: true,
          },
        });
        if (!user) {
          const error = new Error("NotFoundUser");
          error.name = "NotFoundUser";
          throw error;
        }
      }

      // check product
      const productId = _productId ? +_productId.toString() : null;
      const product = productId
        ? await client.user.findUnique({
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

      // find exist chat
      const existChat = await client.chat.findFirst({
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

      if (existChat) {
        const result: PostChatsResponse = {
          success: true,
          chat: existChat,
        };
        return res.status(200).json(result);
      }

      // create new chat
      const newChat = await client.chat.create({
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
      });

      // result
      const result: PostChatsResponse = {
        success: true,
        chat: newChat,
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
