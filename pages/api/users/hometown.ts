import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

import { AdmType } from "@prisma/client";
import { getAbsoluteUrl } from "@libs/utils";
import { GetAddrGeocodeResponse } from "@api/address/addr-geocode";

interface AdmInfo {
  admCd: string;
  admNm: string;
  posX: number;
  posY: number;
}

export interface PostHometownResponse {
  success: boolean;
  isSaved: boolean;
  admInfo: AdmInfo;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
  }
  if (req.method === "POST") {
    try {
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
      const admInfo: AdmInfo = { admCd: "", admNm: "", posX: 0, posY: 0 };
      if (req.body.admCd !== null) {
        admInfo.admCd = req.body.admCd;
        admInfo.admNm = req.body.admNm;
        admInfo.posX = +req.body.posX;
        admInfo.posY = +req.body.posY;
      } else {
        const { origin: originUrl } = getAbsoluteUrl(req);
        const { emdong }: GetAddrGeocodeResponse = await (await fetch(`${originUrl}/api/address/addr-geocode?addrName=${addrName}`)).json();
        admInfo.admCd = emdong.admCd;
        admInfo.admNm = emdong.admNm;
        admInfo.posX = +emdong.posX;
        admInfo.posY = +emdong.posY;
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

      // save data: client.user
      // todo: 로그인 유저 데이터 확인
      if (foundUser) {
        await client.user.update({
          where: {
            id: foundUser.id,
          },
          data: {
            admType: admType,
            ...(admType === AdmType.MAIN
              ? {
                  admPosX_main: admInfo.posX,
                  admPosY_main: admInfo.posY,
                }
              : {}),
            ...(admType === AdmType.SUB
              ? {
                  admPosX_sub: admInfo.posX,
                  admPosY_sub: admInfo.posY,
                }
              : {}),
          },
        });
      }

      // result
      const result: PostHometownResponse = {
        success: true,
        isSaved: Boolean(foundUser),
        admInfo,
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
}

export default withSessionRoute(
  withHandler({
    methods: [
      { type: "GET", isPrivate: false },
      { type: "POST", isPrivate: false },
    ],
    handler,
  })
);
