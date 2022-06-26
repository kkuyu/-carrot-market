import { NextApiRequest, NextApiResponse } from "next";
import { AdmType, Product, Record } from "@prisma/client";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { getAbsoluteUrl } from "@libs/utils";
import { GetAddrGeocodeResponse } from "@api/address/addr-geocode";

export interface PostHometownResponse {
  success: boolean;
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
      const { addrName, admCd: _admCd, admNm: _admNm, admType } = req.body;
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
      let admCd;
      let admNm;
      if (_admCd !== null) {
        admCd = _admCd;
        admNm = _admNm;
      } else {
        const { origin: originUrl } = getAbsoluteUrl(req);
        const { emdong }: GetAddrGeocodeResponse = await (await fetch(`${originUrl}/api/address/addr-geocode?addrName=${addrName}`)).json();
        admCd = emdong.admCd;
        admNm = emdong.admNm;
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
      // todo: 법정동과 행정동이 다른 경우 토스트 노출
      if (!foundUser) {
        req.session.dummyUser = {
          id: -1,
          admType: AdmType.MAIN,
          admCdMain: admCd,
          admNmMain: admNm,
        };
        await req.session.save();
      } else {
        await client.user.update({
          where: {
            id: foundUser.id,
          },
          data: {
            admType: admType,
            ...(admType === AdmType.MAIN ? { admCdMain: admCd, admNmMain: admNm } : {}),
            ...(admType === AdmType.SUB ? { admCdSub: admCd, admNmSub: admNm } : {}),
          },
        });
      }

      // result
      const result: PostHometownResponse = {
        success: true,
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
