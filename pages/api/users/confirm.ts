import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { token } = req.body;
  if (!token) {
    const error = new Error("Invalid request body");
    throw error;
  }

  const foundToken = await client.token.findUnique({
    where: {
      payload: token,
    },
  });
  if (!foundToken) {
    const error = new Error("Invalid token");
    throw error;
  }
  req.session.user = {
    id: foundToken.userId,
  };
  await req.session.save();
  await client.token.deleteMany({
    where: {
      userId: foundToken.userId,
    },
  });
  return res.status(200).json({
    success: true,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["POST"],
    handler,
    isPrivate: false,
  })
);
