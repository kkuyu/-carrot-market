import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { id } = req.query;
  const { user } = req.session;
  const cleanId = +id?.toString()!;

  const stream = await client.stream.findFirst({
    where: {
      id: cleanId,
      userId: user?.id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
    },
  });
  if (!stream) {
    const error = new Error("Not found stream");
    throw error;
  }
  await client.stream.delete({
    where: {
      id: cleanId,
    },
  });
  return res.status(200).json({
    success: true,
    stream,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["POST"],
    handler,
  })
);
