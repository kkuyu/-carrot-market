import { NextApiRequest, NextApiResponse } from "next";
import { ChatMessage } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostChatsMessageResponse extends ResponseDataType {
  chatMessage: ChatMessage;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
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

    // fetch data
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

    // create new chat message
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
