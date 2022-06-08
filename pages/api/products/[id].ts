import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { id } = req.query;
  const product = await client.product.findUnique({
    where: {
      id: +id?.toString()!,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
  return res.status(200).json({
    success: true,
    product,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["GET"],
    handler,
  })
);
