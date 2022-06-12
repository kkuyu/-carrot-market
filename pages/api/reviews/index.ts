import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { user } = req.session;
  const reviews = await client.review.findMany({
    where: {
      createdForId: user?.id,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
  if (!reviews) {
    res.status(200).json({
      success: true,
      reviews: [],
    });
  }
  return res.status(200).json({
    success: true,
    reviews,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["GET"],
    handler,
  })
);
