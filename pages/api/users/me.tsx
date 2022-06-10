import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const profile = await client.user.findUnique({
    where: {
      id: req.session.user?.id,
    },
  });
  if (!profile) {
    const error = new Error("Not found profile");
    throw error;
  }
  return res.status(200).json({
    success: true,
    profile,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["GET"],
    handler,
  })
);
