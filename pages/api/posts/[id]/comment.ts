import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { id } = req.query;
  const { comment } = req.body;
  const { user } = req.session;
  const cleanId = +id?.toString()!;
  const post = await client.post.findUnique({
    where: {
      id: cleanId,
    },
    select: {
      id: true,
    },
  });
  if (!post) {
    const error = new Error("Not found post");
    throw error;
  }
  await client.comment.create({
    data: {
      user: {
        connect: {
          id: user?.id,
        },
      },
      post: {
        connect: {
          id: cleanId,
        },
      },
      comment,
    },
  });
  return res.status(200).json({
    success: true,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["POST"],
    handler,
  })
);
