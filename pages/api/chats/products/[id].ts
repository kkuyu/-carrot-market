import { NextApiRequest, NextApiResponse } from "next";
import { Chat, ChatMessage, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetChatsByProductsResponse {
  success: boolean;
  chats: (Chat & {
    users: Pick<User, "id" | "name" | "avatar">[];
    chatMessages: ChatMessage[];
  })[];
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

    if (!user?.id) {
      const result: GetChatsByProductsResponse = {
        success: true,
        chats: [],
      };
      return res.status(200).json(result);
    }

    // fetch data: client.chat
    const id = +_id.toString();
    const chats = await client.chat.findMany({
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
      where: {
        users: {
          some: {
            id: user.id,
          },
        },
        productId: id,
      },
    });

    // result
    const result: GetChatsByProductsResponse = {
      success: true,
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
