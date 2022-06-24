import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import sendEmail from "@libs/server/sendEmail";
import withHandler, { ResponseType } from "@libs/server/withHandler";

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

    // user check
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

    // create token
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
      emailTo: email,
      emailSubject: "[당근마켓] 이메일 로그인을 위한 인증 코드를 발송 드려요.",
      emailContent: `<div>
        <h1>당근마켓 이메일 로그인을 위한 인증번호를 보내드려요.</h1>
        <h2>이메일 로그인 화면에서 아래의 인증번호를 입력하고 로그인을 완료해주세요.</h2>
        <div><strong>${newToken.payload}</strong></div>
        <p>
          혹시 요청하지 않은 인증 메일을 받으셨나요?<br />
          누군가 실수로 메일 주소를 잘못 입력했을 수 있어요. 계정이 도용된 것은 아니니 안심하세요.<br />
          직접 요청한 인증 메일이 아닌 경우 무시해주세요.
        </p>
      </div>`,
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
