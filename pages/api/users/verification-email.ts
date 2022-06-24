import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

import { EmailTemplateKey } from "@libs/server/getUtilsNcp";
import sendEmail from "@libs/server/sendEmail";

export interface PostVerificationEmailResponse {
  success: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { email } = req.body;

    // request valid
    if (!email || !email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // check user
    const foundUser = await client.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });
    if (!foundUser) {
      const error = new Error("이메일 주소를 다시 확인해주세요.");
      error.name = "NotFoundUser";
      throw error;
    }

    // create new token
    const newToken = await client.token.create({
      data: {
        payload: Math.floor(100000 + Math.random() * 900000) + "",
        user: {
          connect: {
            email,
          },
        },
      },
    });
    sendEmail({
      sendTo: email,
      templateId: EmailTemplateKey.verificationEmail,
      parameters: {
        token: newToken.payload,
      },
    });

    // result
    const result: PostVerificationEmailResponse = {
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
    methods: ["POST"],
    handler,
    isPrivate: false,
  })
);
