import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { id } = req.query;
  const { message } = req.body;
  const { user } = req.session;
  const cleanId = +id?.toString()!;
  if (!message) {
    const error = new Error("Invalid request body");
    throw error;
  }
  const newMessage = await client.message.create({
    data: {
      message,
      stream: {
        connect: {
          id: cleanId,
        },
      },
      user: {
        connect: {
          id: user?.id,
        },
      },
    },
  });
  return res.status(200).json({
    success: true,
    message: newMessage,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["POST"],
    handler,
  })
);
