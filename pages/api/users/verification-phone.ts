import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

import { MessageTemplateKey } from "@libs/server/getUtilsNcp";
import sendMessage from "@libs/server/sendMessage";

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

    // check user
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

    // create new token
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
      templateId: MessageTemplateKey.verificationPhone,
      sendTo: phone,
      parameters: {
        token: newToken.payload,
      },
    });

    // result
    const result: PostVerificationPhoneResponse = {
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
