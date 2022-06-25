import { NextApiRequest, NextApiResponse } from "next";

import { getRandomName } from "@libs/utils";
import client from "@libs/server/client";

import sendMessage from "@libs/server/sendMessage";
import withHandler, { ResponseType } from "@libs/server/withHandler";

export interface PostLoginResponse {
  success: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { phone } = req.body;

    // request valid
    if (!phone || phone.length < 8) {
      const error = new Error("잘못된 요청 본문입니다");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // user check
    const foundUser = await client.user.findUnique({
      where: {
        phone,
      },
      select: {
        id: true,
      },
    });
    if (!foundUser) {
      const error = new Error("유효하지 않은 휴대폰 번호입니다.");
      error.name = "NotFoundUser";
      throw error;
    }

    // create token
    const newToken = await client.token.create({
      data: {
        payload: Math.floor(100000 + Math.random() * 900000) + "",
        user: {
          connect: {
            phone,
          },
        },
      },
    });
    sendMessage({
      messageTo: phone,
      messageContent: `[당근마켓] 인증번호 [${newToken.payload}] *타인에게 절대 알리지 마세요.(계정 도용 위험)`,
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

export default withHandler({
  methods: ["POST"],
  handler,
  isPrivate: false,
});
