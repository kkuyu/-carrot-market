import { NextApiRequest, NextApiResponse } from "next";
// @libs
import { getRandomNumber } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { MessageTemplateKey } from "@libs/server/getUtilsNcp";
import sendMessage from "@libs/server/sendMessage";

export interface PostAccountLoginPhoneResponse extends ResponseDataType {
  phone: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { phone } = req.body;

    // invalid
    if (!phone) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (phone && phone.length < 8) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch user
    const foundUser = await client.user.findFirst({
      where: {
        phone,
      },
      select: {
        id: true,
      },
    });
    console.log("foundUser", foundUser);
    if (!foundUser) {
      const error = new Error("휴대폰 번호를 다시 확인해주세요.");
      error.name = "NotFoundUser";
      throw error;
    }

    // create token
    const newToken = await client.token.create({
      data: {
        phone,
        payload: `${getRandomNumber(100000, 999999)}`,
        user: {
          ...(foundUser ? { connect: { id: foundUser?.id } } : null),
        },
      },
    });
    console.log("newToken", newToken);

    // send message
    sendMessage({
      templateId: MessageTemplateKey.verificationPhone,
      sendTo: phone,
      parameters: {
        token: newToken.payload,
      },
    });

    // result
    const result: PostAccountLoginPhoneResponse = {
      success: true,
      phone,
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
