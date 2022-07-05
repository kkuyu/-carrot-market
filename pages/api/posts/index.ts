import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { Post, User } from "@prisma/client";

export interface GetPostsResponse {
  success: boolean;
  posts: (Post & { user: Pick<User, "id" | "name">; _count: { curiosities: number; comments: number } })[];
  pages: number;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

export interface PostPostsResponse {
  success: boolean;
  post: Post;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    try {
      const { page: _page, posX: _posX, posY: _posY, distance: _distance } = req.query;

      // request valid
      if (!_page) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!_posX || !_posY || !_distance) {
        const result: GetPostsResponse = {
          success: true,
          posts: [],
          pages: 1,
        };
        return res.status(200).json(result);
      }

      // get data props
      const displayRow = 10;
      const page = +_page.toString();
      const posX = +_posX.toString();
      const posY = +_posY.toString();
      const distance = +_distance.toString();
      const boundaryArea = {
        emdPosX: { gte: posX - distance, lte: posX + distance },
        emdPosY: { gte: posY - distance, lte: posY + distance },
      };

      // fetch data: client.post
      const totalPosts = await client.post.count({
        where: boundaryArea,
      });
      const posts = await client.post.findMany({
        take: displayRow,
        skip: (page - 1) * displayRow,
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
        where: boundaryArea,
      });

      // result
      const result: GetPostsResponse = {
        success: true,
        posts,
        pages: Math.ceil(totalPosts / displayRow),
      };
      return res.status(200).json(result);
    } catch (error: unknown) {
      // error
      if (error instanceof Error) {
        const result = {
          success: false,
          error: {
            timestamp: Date.now().toString(),
            name: error.name,
            message: error.message,
          },
        };
        return res.status(422).json(result);
      }
    }
  }
  if (req.method === "POST") {
    return res.status(200);
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
    methods: [
      { type: "GET", isPrivate: false },
      { type: "POST", isPrivate: true },
    ],
    handler,
  })
);
