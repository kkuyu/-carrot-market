import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostTokenResponse {
  success: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { token } = req.body;

    // request valid
    if (!token) {
      const error = new Error("잘못된 요청 본문입니다");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // token check
    const foundToken = await client.token.findUnique({
      where: {
        payload: token,
      },
    });
    if (!foundToken) {
      const error = new Error("유효하지 않은 인증번호입니다.");
      error.name = "InvalidToken";
      throw error;
    }

    // session save token
    req.session.user = {
      id: foundToken.userId,
    };
    await req.session.save();

    // client delete token
    await client.token.deleteMany({
      where: {
        userId: foundToken.userId,
      },
    });

    return res.status(200).json({
      success: true,
    });
  } catch (error: unknown) {
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
    methods: ["POST"],
    handler,
    isPrivate: false,
  })
);
