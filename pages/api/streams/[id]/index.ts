import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { id } = req.query;
  const { user } = req.session;
  const cleanId = +id?.toString()!;
  const stream = await client.stream.findUnique({
    where: {
      id: cleanId,
    },
    include: {
      messages: {
        select: {
          id: true,
          message: true,
          user: {
            select: {
              id: true,
              avatar: true,
            },
          },
        },
      },
    },
  });
  if (!stream) {
    const error = new Error("Not found stream");
    throw error;
  }
  const isOwner = stream?.userId === user?.id;
  if (stream && !isOwner) {
    stream.cloudflareKey = "";
    stream.cloudflareUrl = "";
  }

  let recordedVideos = undefined;
  if (stream.cloudflareId) {
    recordedVideos = await (
      await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/stream/live_inputs/${stream.cloudflareId}/videos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}`,
        },
      })
    ).json();
  }

  return res.status(200).json({
    success: true,
    stream,
    ...(recordedVideos && { recordedVideos }),
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["GET"],
    handler,
  })
);
