import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import sendMessage from "@libs/server/sendMessage";
import withHandler, { ResponseType } from "@libs/server/withHandler";

export interface PostVerificationPhoneResponse {
  success: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { phone, targetEmail } = req.body;

    // request valid
    if (!phone || phone.length < 8) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!targetEmail || !targetEmail.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // user check
    const foundUserByEmail = await client.user.findUnique({
      where: {
        email: targetEmail,
      },
      select: {
        id: true,
        phone: true,
      },
    });
    if (foundUserByEmail) {
      if (foundUserByEmail.phone === phone) {
        const error = new Error("등록된 휴대폰 번호와 같은 번호예요. 변경하실 휴대폰 번호를 입력해주세요.");
        error.name = "SameExistingAccount";
        throw error;
      }
    }
    const foundUserByPhone = await client.user.findUnique({
      where: {
        phone,
      },
      select: {
        id: true,
      },
    });
    if (foundUserByPhone) {
      const error = new Error("이미 가입한 휴대폰 번호예요. 휴대폰 번호를 다시 확인해주세요.");
      error.name = "AlreadySubscribedAccount";
      throw error;
    }

    // create token
    const newToken = await client.token.create({
      data: {
        payload: Math.floor(100000 + Math.random() * 900000) + "",
        user: {
          connect: {
            email: targetEmail,
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
