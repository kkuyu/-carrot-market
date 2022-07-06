import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { Comment, Post, User } from "@prisma/client";

export interface GetPostDetailResponse {
  success: boolean;
  post: Post & {
    user: Pick<User, "id" | "name" | "avatar">;
    comments: (Pick<Comment, "id" | "comment" | "emdPosNm" | "updatedAt"> & { user: Pick<User, "id" | "name" | "avatar"> })[];
    _count: { curiosities: number };
  };
  isCuriosity: boolean;
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
          },
        },
      },
    });
    if (!post) {
      const error = new Error("NotFoundPost");
      error.name = "NotFoundPost";
      throw error;
    }

    const isCuriosity = user?.id
      ? Boolean(
          await client.curiosity.findFirst({
            where: {
              postId: post.id,
              userId: user.id,
            },
            select: {
              id: true,
            },
          })
        )
      : false;

    // result
    const result: GetPostDetailResponse = {
      success: true,
      post,
      isCuriosity,
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
