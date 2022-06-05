import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
    });
  }

  console.log(token);

  return res.status(200).end();
}

export default withHandler("POST", handler);
