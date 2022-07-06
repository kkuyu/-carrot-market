import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostPostsCuriosityResponse {
  success: boolean;
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
      select: {
        id: true,
      },
    });
    if (!post) {
      const error = new Error("NotFoundPost");
      error.name = "NotFoundPost";
      throw error;
    }

    // check current curiosity status
    const exists = await client.curiosity.findFirst({
      where: {
        userId: user?.id,
        postId: post.id,
      },
      select: {
        id: true,
      },
    });

    if (exists) {
      // delete
      await client.curiosity.delete({
        where: {
          id: exists.id,
        },
      });
    } else {
      // create
      await client.curiosity.create({
        data: {
          user: {
            connect: {
              id: user?.id,
            },
          },
          post: {
            connect: {
              id: post.id,
            },
          },
        },
      });
    }

    // result
    const result: PostPostsCuriosityResponse = {
      success: true,
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
    methods: [{ type: "POST", isPrivate: true }],
    handler,
  })
);
