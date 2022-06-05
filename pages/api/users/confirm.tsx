import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
    });
  }

  const foundToken = await client.token.findUnique({
    where: {
      payload: token,
    },
    // include: {
    //   user: true,
    // },
  });
  if (!foundToken) {
    return res.status(400).json({
      success: false,
    });
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

export default withSessionRoute(withHandler("POST", handler));
