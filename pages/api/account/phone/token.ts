import { NextApiRequest, NextApiResponse } from "next";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { EmdType } from "@prisma/client";

export interface PostAccountPhoneTokenResponse extends ResponseDataType {}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { phone, token, name, mainAddrNm, mainPosX, mainPosY, mainDistance } = req.body;

    // invalid
    if (!phone || !token) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (phone && phone.length < 8) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const foundToken = await client.token.findFirst({
      where: {
        phone,
        payload: token,
      },
    });
    if (!foundToken) {
      const error = new Error("인증번호를 다시 확인해주세요.");
      error.name = "InvalidToken";
      throw error;
    }
    if (!foundToken && (!name || !mainAddrNm || !mainPosX || !mainPosY || !mainDistance)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    const foundUser = await client.user.upsert({
      where: {
        id: foundToken?.userId || 0,
      },
      create: {
        name,
        phone,
        emdType: EmdType.MAIN,
        MAIN_emdAddrNm: mainAddrNm,
        MAIN_emdPosNm: mainAddrNm.match(/(\S+)$/g)?.[0],
        MAIN_emdPosX: mainPosX,
        MAIN_emdPosY: mainPosY,
        MAIN_emdPosDx: mainDistance,
        enteredAt: new Date(),
      },
      update: {
        // phone,
        enteredAt: new Date(),
      },
    });

    // delete token
    await client.token.deleteMany({
      where: {
        userId: foundUser?.id,
      },
    });

    // update user
    req.session.user = {
      id: foundUser?.id,
    };
    delete req.session.dummyUser;
    await req.session.save();

    // result
    const result: PostAccountPhoneTokenResponse = {
      success: true,
    };
    return res.status(200).json(result);
  } catch (error: unknown) {
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
