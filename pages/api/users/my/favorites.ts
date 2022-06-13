import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { user } = req.session;
  const favorites = await client.favorite.findMany({
    where: {
      userId: user?.id,
    },
    include: {
      product: true,
    },
  });
  if (!favorites) {
    return res.status(200).json({
      success: true,
      favorites: [],
    });
  }
  return res.status(200).json({
    success: true,
    favorites,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["GET"],
    handler,
  })
);
