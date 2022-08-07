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
  isExisted: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { phone, mainAddrNm, mainPosX, mainPosY, mainDistance } = req.body;

    // request valid
    if (!phone || phone.length < 8) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (!mainAddrNm || !mainPosX || !mainPosY || !mainDistance) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // get data props
    const user = await client.user.findFirst({
      where: {
        phone,
      },
      select: {
        id: true,
      },
    });

    // create new token
    const newToken = await client.token.create({
      data: {
        payload: Math.floor(100000 + Math.random() * 900000) + "",
        user: {
          connectOrCreate: {
            where: {
              id: user?.id,
            },
            create: {
              name: getRandomName(),
              phone,
              emdType: EmdType.MAIN,
              MAIN_emdAddrNm: mainAddrNm,
              MAIN_emdPosNm: mainAddrNm.match(/(\S+)$/g)?.[0],
              MAIN_emdPosX: mainPosX,
              MAIN_emdPosY: mainPosY,
              MAIN_emdPosDx: mainDistance,
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
      isExisted: Boolean(user),
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
