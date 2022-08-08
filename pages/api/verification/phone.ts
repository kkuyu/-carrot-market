import { NextApiRequest, NextApiResponse } from "next";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { MessageTemplateKey } from "@libs/server/getUtilsNcp";
import sendMessage from "@libs/server/sendMessage";

export interface PostVerificationPhoneResponse extends ResponseDataType {}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { phone, targetEmail } = req.body;

    // invalid
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

    // fetch data
    const foundUserByEmail = await client.user.findUnique({
      where: {
        email: targetEmail,
      },
      select: {
        id: true,
        phone: true,
      },
    });
    if (!foundUserByEmail) {
      const error = new Error("계정 정보를 다시 확인해주세요.");
      error.name = "NotFoundUser";
      throw error;
    }
    if (foundUserByEmail && foundUserByEmail.phone === phone) {
      const error = new Error("등록된 휴대폰 번호와 같은 번호예요. 변경하실 휴대폰 번호를 입력해주세요.");
      error.name = "SameAccount";
      throw error;
    }

    // fetch user
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

    // send message
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
      const result = {
        success: false,
        error: {
          timestamp: date,
          name: error.name,
          message: error.message,
        },
      };
      return res.status(422).json(result);
    }
  }
}

export default withSessionRoute(
  withHandler({
    methods: [{ type: "POST", isPrivate: false }],
    handler,
  })
);
