import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { Comment, Feeling, Post, User } from "@prisma/client";

export interface GetPostDetailResponse {
  success: boolean;
  post: Post & {
    user: Pick<User, "id" | "name" | "avatar">;
    curiosity: boolean;
    curiosities: { count: number };
    emotion: Feeling | null;
    emotions: { count: number; feelings: Feeling[] };
    comments: (Pick<Comment, "id" | "comment" | "emdPosNm" | "updatedAt"> & { user: Pick<User, "id" | "name" | "avatar"> })[];
  };
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id } = req.query;
    const { user } = req.session;

    // request valid
    if (!_id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // find post detail
    const id = +_id.toString();
    const post = await client.post.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
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
        comments: {
          select: {
            id: true,
            comment: true,
            updatedAt: true,
            emdPosNm: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            curiosities: true,
            emotions: true,
            comments: true,
          },
        },
      },
    });
    if (!post) {
      const error = new Error("NotFoundPost");
      error.name = "NotFoundPost";
      throw error;
    }

    // result
    const result: GetPostDetailResponse = {
      success: true,
      post: {
        ...post,
        curiosity: !user?.id ? false : Boolean(post.curiosities.find((v) => v.userId === user.id)),
        curiosities: { count: post.curiosities.length },
        emotion: !user?.id ? null : post.emotions.find((v) => v.userId === user.id)?.feeling || null,
        emotions: { count: post.emotions.length, feelings: [...new Set(post.emotions.map((v) => v.feeling))] },
      },
    };
    return res.status(200).json(result);
  } catch (error: unknown) {
    // error
    if (error instanceof Error) {
      const date = Date.now().toString();
      return res.status(422).json({
        success: false,
        error: {
          timestamp: date,
          name: error.name,
          message: error.message,
        },
      });
    }
  }
}

export default withSessionRoute(
  withHandler({
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
