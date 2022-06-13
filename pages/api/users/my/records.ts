import { NextApiRequest, NextApiResponse } from "next";
import { Kind } from "@prisma/client";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { user } = req.session;
  const { kind = "" } = req.query;
  if (!Object.values<string>(Kind).includes(kind.toString())) {
    const error = new Error("Invalid enum type");
    throw error;
  }
  const kindValue = kind.toString() as Kind;
  const records = await client.record.findMany({
    where: {
      userId: user?.id,
      kind: kindValue,
    },
  });
  if (!records) {
    return res.status(200).json({
      success: true,
      [kindValue]: [],
    });
  }
  return res.status(200).json({
    success: true,
    [kindValue]: records,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["GET"],
    handler,
  })
);
