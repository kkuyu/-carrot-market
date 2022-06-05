import { NextApiRequest, NextApiResponse } from "next";
import { withIronSessionApiRoute } from "iron-session/next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
    });
  }

  const exists = await client.token.findUnique({
    where: {
      payload: token,
    },
    // include: {
    //   user: true,
    // },
  });
  if (!exists) {
    return res.status(400).end();
  }
  req.session.user = {
    id: exists.userId,
  };
  await req.session.save();
  return res.status(200).end();
}

export default withIronSessionApiRoute(withHandler("POST", handler), {
  cookieName: "carrot-market-session",
  password: process.env.SESSION_PASSWORD!,
});
