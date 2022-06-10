import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
  }
  if (req.method === "POST") {
    const { question } = req.body;
    const { user } = req.session;
    const post = await client.post.create({
      data: {
        question,
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    });
    return res.status(200).json({
      success: true,
      post,
    });
  }
}

export default withSessionRoute(
  withHandler({
    methods: ["GET", "POST"],
    handler,
  })
);
