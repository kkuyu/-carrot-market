import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { id } = req.query;
  const cleanId = +id?.toString()!;
  const post = await client.post.findUnique({
    where: {
      id: cleanId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      comments: {
        select: {
          id: true,
          comment: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          curiosities: true,
        },
      },
    },
  });
  if (!post) {
    const error = new Error("Not found post");
    throw error;
  }
  return res.status(200).json({
    success: true,
    post,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["GET"],
    handler,
  })
);
