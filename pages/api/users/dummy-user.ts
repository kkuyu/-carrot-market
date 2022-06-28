import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseType } from "@libs/server/withHandler";

export interface PostDummyUserResponse {
  success: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { posX, posY } = req.body;

    // request valid
    if (!posX || !posY) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // create dummy user
    req.session.dummyUser = {
      admPosX_main: +posX,
      admPosY_main: +posY,
    };
    delete req.session.user;
    await req.session.save();

    // result
    const result: PostDummyUserResponse = {
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
    methods: [{ type: "POST", isPrivate: false }],
    handler,
  })
);
