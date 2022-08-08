import { NextApiRequest, NextApiResponse } from "next";
import { EmdType } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { getRandomName } from "@libs/utils";
import { MessageTemplateKey } from "@libs/server/getUtilsNcp";
import sendMessage from "@libs/server/sendMessage";

export interface PostJoinResponse extends ResponseDataType {
  isExisted: boolean;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { phone, mainAddrNm, mainPosX, mainPosY, mainDistance } = req.body;

    // invalid
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

    // fetch data
    const user = await client.user.findFirst({
      where: {
        phone,
      },
      select: {
        id: true,
      },
    });

    // create token
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

    // send message
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
