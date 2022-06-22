import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { Review, User } from "@prisma/client";

export interface GetReviewsResponse {
  success: boolean;
  reviews: (Review & { createdBy: Pick<User, "id" | "name" | "avatar"> })[];
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { user } = req.session;
  const reviews = await client.review.findMany({
    orderBy: {
      createdAt: "desc",
    },
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
