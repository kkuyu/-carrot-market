import { NextApiRequest, NextApiResponse } from "next";
import { Chat, ChatMessage, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostChatsMessageResponse {
  success: boolean;
  chatMessage: ChatMessage;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id } = req.query;
    const { text } = req.body;
    const { user } = req.session;

    // request valid
    if (!_id || !text) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    const id = +_id?.toString();
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

    // create client.chatMessage
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

    // update client.chat
    const updateChat = await client.chat.update({
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
    const result: PostChatsMessageResponse = {
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

export default withSessionRoute(
  withHandler({
    methods: [{ type: "POST", isPrivate: true }],
    handler,
  })
);
