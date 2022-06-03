import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler from "@libs/server/withHandler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { phone, email } = req.body;
  const userPayload = {
    ...(phone ? { phone: +phone } : {}),
    ...(email ? { email } : {}),
  };
  const tokenPayload = Math.floor(100000 + Math.random() * 900000) + "";
  const token = await client.token.create({
    data: {
      payload: tokenPayload,
      user: {
        connectOrCreate: {
          where: {
            ...userPayload,
          },
          create: {
            name: "Anonymous",
            ...userPayload,
          },
        },
      },
    },
  });
  console.log(token);
  return res.status(200).end();
}

export default withHandler("POST", handler);
