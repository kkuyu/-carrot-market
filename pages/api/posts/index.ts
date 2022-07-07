import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { Curiosity, Feeling, Post, User } from "@prisma/client";

import { getCategory } from "@libs/utils";

export interface GetPostsResponse {
  success: boolean;
  posts: (Post & {
    user: Pick<User, "id" | "name">;
    curiosity: boolean;
    curiosities: { count: number };
    emotion: Feeling | null;
    emotions: { count: number; feelings: Feeling[] };
    _count: { comments: number };
  })[];
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
      const { user } = req.session;

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
      const posts = await (
        await client.post.findMany({
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
            curiosities: {
              select: {
                id: true,
                userId: true,
              },
            },
            emotions: {
              select: {
                id: true,
                userId: true,
                feeling: true,
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
        })
      ).map((post) => {
        return {
          ...post,
          curiosity: !user?.id ? false : Boolean(post.curiosities.find((v) => v.userId === user.id)),
          curiosities: { count: post.curiosities.length },
          emotion: !user?.id ? null : post.emotions.find((v) => v.userId === user.id)?.feeling || null,
          emotions: { count: post.emotions.length, feelings: [...new Set(post.emotions.map((v) => v.feeling))] },
        };
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
    try {
      const { photo = "", category, content, emdAddrNm, emdPosNm, emdPosX, emdPosY } = req.body;
      const { user } = req.session;

      // request valid
      if (!content && !category) {
        const error = new Error("Invalid request body");
        throw error;
      }
      if (!getCategory("post", category)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!emdAddrNm || !emdPosNm || !emdPosX || !emdPosY) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // create new post
      const newPost = await client.post.create({
        data: {
          photo,
          content,
          category,
          emdAddrNm,
          emdPosNm,
          emdPosX,
          emdPosY,
          user: {
            connect: {
              id: user?.id,
            },
          },
        },
      });

      // result
      const result: PostPostsResponse = {
        success: true,
        post: newPost,
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
