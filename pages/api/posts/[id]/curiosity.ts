import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { id } = req.query;
  const { user } = req.session;
  const cleanId = +id?.toString()!;
  const exists = await client.curiosity.findFirst({
    where: {
      userId: user?.id,
      postId: cleanId,
    },
    select: {
      id: true,
    },
  });
  if (exists) {
    await client.curiosity.delete({
      where: {
        id: exists.id,
      },
    });
  }
  if (!exists) {
    await client.curiosity.create({
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
      },
    });
  }
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
