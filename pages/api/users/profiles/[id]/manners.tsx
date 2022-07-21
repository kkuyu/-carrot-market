import { NextApiRequest, NextApiResponse } from "next";
import { Manner } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProfilesMannersResponse {
  success: boolean;
  manners: (Manner & { reviews: { satisfaction: string }[] })[];
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { id: _id } = req.query;
  const { user } = req.session;

  // request valid
  if (!_id) {
    const error = new Error("InvalidRequestBody");
    error.name = "InvalidRequestBody";
    throw error;
  }

  // fetch data: client.manner
  const id = +_id.toString();
  const manners = await client.manner.findMany({
    orderBy: {
      count: "desc",
    },
    where: {
      userId: id,
      ...(id !== user?.id
        ? {
            reviews: {
              none: { satisfaction: "dislike" },
            },
          }
        : {}),
    },
    include: {
      reviews: {
        select: {
          satisfaction: true,
        },
      },
    },
  });

  // result
  const result: GetProfilesMannersResponse = {
    success: true,
    manners,
  };
  return res.status(200).json(result);
}

export default withSessionRoute(
  withHandler({
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
