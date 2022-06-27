import { NextApiRequest, NextApiResponse } from "next";
import { AdmType, Product, Record } from "@prisma/client";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { getAbsoluteUrl } from "@libs/utils";
import { GetAddrGeocodeResponse } from "@api/address/addr-geocode";

export interface PostHometownResponse {
  success: boolean;
  requestAmd: {
    admCd: string;
    admNm: string;
  };
  responseAmd: {
    admCd: string;
    admNm: string;
  };
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    if (req.method === "GET") {
    }
    if (req.method === "POST") {
      const { addrName, admType } = req.body;
      const { user } = req.session;

      // request valid
      if (!addrName) {
        const error = new Error("Invalid request body");
        throw error;
      }
      if (admType === null || admType === AdmType.MAIN || admType === AdmType.SUB) {
        const error = new Error("Invalid request body");
        throw error;
      }

      // get data config
      const admObj = { admCd: "", admNm: "", posX: 0, posY: 0 };
      if (req.body.admCd !== null) {
        admObj.admCd = req.body.admCd;
        admObj.admNm = req.body.admNm;
        admObj.posX = +req.body.posX;
        admObj.posY = +req.body.posY;
      } else {
        const { origin: originUrl } = getAbsoluteUrl(req);
        const { emdong }: GetAddrGeocodeResponse = await (await fetch(`${originUrl}/api/address/addr-geocode?addrName=${addrName}`)).json();
        admObj.admCd = emdong.admCd;
        admObj.admNm = emdong.admNm;
        admObj.posX = +emdong.posX;
        admObj.posY = +emdong.posY;
      }

      // check user
      const foundUser = user?.id
        ? await client.user.findUnique({
            where: {
              id: user.id,
            },
            select: {
              id: true,
            },
          })
        : null;

      // save data: session.dummyUser or client.user
      // todo: 로그인 유저 데이터 확인
      if (!foundUser) {
        req.session.dummyUser = {
          id: -1,
          admType: AdmType.MAIN,
          admPosX_main: admObj.posX,
          admPosY_main: admObj.posY,
        };
        await req.session.save();
      } else {
        await client.user.update({
          where: {
            id: foundUser.id,
          },
          data: {
            admType: admType,
            ...(admType === AdmType.MAIN
              ? {
                  admPosX_main: admObj.posX,
                  admPosY_main: admObj.posY,
                }
              : {}),
            ...(admType === AdmType.SUB
              ? {
                  admPosX_sub: admObj.posX,
                  admPosY_sub: admObj.posY,
                }
              : {}),
          },
        });
      }

      // result
      const result: PostHometownResponse = {
        success: true,
        requestAmd: {
          admCd: req.body.admCd,
          admNm: req.body.admNm,
        },
        responseAmd: {
          admCd: admObj.admCd,
          admNm: admObj.admNm,
        },
      };
      return res.status(200).json(result);
    }
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
    methods: ["GET", "POST"],
    handler,
    isPrivate: false,
  })
);
