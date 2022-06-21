import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    const { page, latitude, longitude } = req.query;
    const cleanPage = +page?.toString()!;
    const cleanLatitude = parseFloat((latitude || 0).toString());
    const cleanLongitude = parseFloat((longitude || 0).toString());

    const displayRow = 10;
    const totalPageCount = await client.post.count();
    const posts = await client.post.findMany({
      take: displayRow,
      skip: (cleanPage - 1) * displayRow,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            curiosities: true,
            comments: true,
          },
        },
      },
      where: {
        latitude: {
          gte: cleanLatitude - 0.01,
          lte: cleanLatitude + 0.01,
        },
        longitude: {
          gte: cleanLongitude - 0.01,
          lte: cleanLongitude + 0.01,
        },
      },
    });
    if (!posts) {
      return res.status(200).json({
        success: true,
        posts: [],
        pages: 1,
      });
    }
    return res.status(200).json({
      success: true,
      posts,
      pages: Math.ceil(totalPageCount / displayRow),
    });
  }
  if (req.method === "POST") {
    const { question, latitude, longitude } = req.body;
    const { user } = req.session;
    if (!question) {
      const error = new Error("Invalid request body");
      throw error;
    }
    const newPost = await client.post.create({
      data: {
        question,
        latitude,
        longitude,
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    });
    return res.status(200).json({
      success: true,
      post: newPost,
    });
  }
}

export default withSessionRoute(
  withHandler({
    methods: ["GET", "POST"],
    handler,
  })
);
