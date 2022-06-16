import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    const { page } = req.query;
    const cleanPage = +page?.toString()!;

    const displayRow = 10;
    const totalPageCount = await client.stream.count();
    const streams = await client.stream.findMany({
      take: displayRow,
      skip: (cleanPage - 1) * displayRow,
    });
    if (!streams) {
      return res.status(200).json({
        success: true,
        streams: [],
        pages: 1,
      });
    }
    return res.status(200).json({
      success: true,
      streams,
      pages: Math.ceil(totalPageCount / displayRow),
    });
  }
  if (req.method === "POST") {
    const { name, price, description } = req.body;
    const { user } = req.session;
    if (!name && !price && !description) {
      const error = new Error("Invalid request body");
      throw error;
    }
    const newStream = await client.stream.create({
      data: {
        name,
        price,
        description,
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    });
    return res.status(200).json({
      success: true,
      stream: newStream,
    });
  }
}

export default withSessionRoute(
  withHandler({
    methods: ["GET", "POST"],
    handler,
  })
);
