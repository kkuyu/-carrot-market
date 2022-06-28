import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseType } from "@libs/server/withHandler";

import { AdmType } from "@prisma/client";
import { getRandomName } from "@libs/utils";
import { MessageTemplateKey } from "@libs/server/getUtilsNcp";
import sendMessage from "@libs/server/sendMessage";

export interface PostJoinResponse {
  success: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { phone, posX, posY } = req.body;

    // request valid
    if (!phone || phone.length < 8) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!posX || !posY) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // create new token
    const newToken = await client.token.create({
      data: {
        payload: Math.floor(100000 + Math.random() * 900000) + "",
        user: {
          connectOrCreate: {
            where: {
              phone,
            },
            create: {
              name: getRandomName(),
              phone,
              admType: AdmType.MAIN,
              admPosX_main: +posX,
              admPosY_main: +posY,
            },
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
    const result: PostJoinResponse = {
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
