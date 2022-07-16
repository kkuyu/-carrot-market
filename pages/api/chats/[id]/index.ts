import { NextApiRequest, NextApiResponse } from "next";
import { Chat, ChatMessage, Kind, Product, Record, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetChatsDetailResponse {
  success: boolean;
  chat: Chat & { users: Pick<User, "id" | "name" | "avatar">[] } & { chatMessages: ChatMessage[] } & { product: (Product & { records: Pick<Record, "id" | "kind" | "userId">[] }) | null };
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

    // find chat detail
    const id = +_id.toString();
    const chat = await client.chat.findUnique({
      where: {
        id,
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
          orderBy: {
            updatedAt: "asc",
          },
        },
        product: {
          include: {
            records: {
              where: {
                OR: [{ kind: Kind.Sale }],
              },
              select: {
                id: true,
                kind: true,
                userId: true,
              },
            },
          },
        },
      },
    });
    if (!chat) {
      const error = new Error("NotFoundChat");
      error.name = "NotFoundChat";
      throw error;
    }
    if (!chat?.users.find((chatUser) => chatUser.id === user?.id)) {
      const error = new Error("NotFoundChat");
      error.name = "NotFoundChat";
      throw error;
    }

    // result
    const result: GetChatsDetailResponse = {
      success: true,
      chat,
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
    methods: [{ type: "GET", isPrivate: true }],
    handler,
  })
);