import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseType } from "@libs/server/withHandler";

import { EmdType } from "@prisma/client";
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
    const { phone, addrNm, distance, posX, posY } = req.body;

    // request valid
    if (!phone || phone.length < 8) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!posX || !posY || !addrNm) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // get data props
    const userPayload = {
      name: getRandomName(),
      phone,
      emdType: EmdType.MAIN,
      MAIN_emdPosNm: addrNm.match(/([가-힣]+|\w+)$/g)[0],
      MAIN_emdPosDx: distance,
      MAIN_emdPosX: posX,
      MAIN_emdPosY: posY,
    };

    // create new token
    const newToken = await client.token.create({
      data: {
        payload: Math.floor(100000 + Math.random() * 900000) + "",
        user: {
          connectOrCreate: {
            where: {
              phone,
            },
            create: userPayload,
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
