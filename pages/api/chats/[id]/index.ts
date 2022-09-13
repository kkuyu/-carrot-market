import { NextApiRequest, NextApiResponse } from "next";
import { Chat, ChatMessage, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetChatsDetailResponse extends ResponseDataType {
  chat: Chat & {
    chatMessages: (ChatMessage & { user: Pick<User, "id" | "name" | "photos"> })[];
    users: Pick<User, "id" | "name" | "photos">[];
  };
}

export interface PostChatsDetailResponse extends ResponseDataType {
  chatMessage: ChatMessage;
}

export const getChatsDetail = async (query: { id: number; userId?: number }) => {
  const { id, userId } = query;

  const chat = await client.chat.findFirst({
    where: {
      id,
      users: {
        some: { id: userId },
      },
    },
    include: {
      chatMessages: {
        orderBy: {
          updatedAt: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              photos: true,
            },
          },
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          photos: true,
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
    chat,
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  if (req.method === "GET") {
    try {
      const { id: _id } = req.query;
      const { user } = req.session;

      // invalid
      if (!_id) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // params
      const id = +_id.toString();
      if (isNaN(id)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // fetch data
      const { chat } = await getChatsDetail({ id, userId: user?.id });
      if (!chat) {
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
        const result = {
          success: false,
          error: {
            timestamp: date,
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
      const { id: _id } = req.query;
      const { text } = req.body;
      const { user } = req.session;

      // invalid
      if (!_id || !text) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // params
      const id = +_id?.toString();
      if (isNaN(id)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // validation: chat
      const chat = await client.chat.findUnique({
        where: {
          id,
        },
      });
      if (!chat) {
        const error = new Error("NotFoundChat");
        error.name = "NotFoundChat";
        throw error;
      }

      // create chatMessage
      const newChatMessage = await client.chatMessage.create({
        data: {
          text,
          user: {
            connect: {
              id: user?.id,
            },
          },
          chat: {
            connect: {
              id: chat.id,
            },
          },
        },
      });

      // update chat
      await client.chat.update({
        where: {
          id,
        },
        data: {
          updatedAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      // result
      const result: PostChatsDetailResponse = {
        success: true,
        chatMessage: newChatMessage,
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
      { type: "GET", isPrivate: true },
      { type: "POST", isPrivate: true },
    ],
    handler,
  })
);
