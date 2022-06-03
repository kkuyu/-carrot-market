import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler from "@libs/server/withHandler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { phone, email } = req.body;
  const payload = {
    ...(phone ? { phone: +phone } : {}),
    ...(email ? { email } : {}),
  };
  const user = await client.user.upsert({
    where: {
      ...payload,
    },
    create: {
      name: "Anonymous",
      ...payload,
    },
    update: {},
  });
  console.log(user);
  return res.status(200).end();
}

export default withHandler("POST", handler);
