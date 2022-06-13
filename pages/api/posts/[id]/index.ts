import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { id } = req.query;
  const { user } = req.session;
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
          createdAt: true,
          user: {
            select: {
              id: true,
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
  const isCuriosity = Boolean(
    await client.curiosity.findFirst({
      where: {
        postId: cleanId,
        userId: user?.id,
      },
      select: {
        id: true,
      },
    })
  );
  return res.status(200).json({
    success: true,
    post,
    isCuriosity,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["GET"],
    handler,
  })
);
