import { NextApiRequest, NextApiResponse } from "next";

import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { getAbsoluteUrl } from "@libs/utils";

interface FetchResponse {
  result: {
    // (0:불완전 매칭, 1:완전매칭)
    matching: string;
    // 결과정보
    resultdata: {
      leg_nm: string; // 읍면동명
      adm_cd: string; // 행정동코드
      adm_nm: string; // 행정동명
      x: string; //	X좌표
      y: string; //	Y좌표
      addr_type: string; // (3:읍면동(법정동), 4:읍면동(행정동))
    }[];
  };
}

export interface GetAddrGeocodeResponse {
  success: boolean;
  emdong: {
    admCd: string;
    admNm: string;
    posX: string;
    posY: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { addrName } = req.query;

    // request valid
    if (!addrName) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // get data props
    const { origin: originUrl } = getAbsoluteUrl(req);
    const { accessToken } = await (await fetch(`${originUrl}/api/address/token`)).json();
    const address = addrName.toString();
    const params = new URLSearchParams({
      accessToken,
      address,
      pagenum: "0",
      resultcount: "1",
    }).toString();

    // fetch data: geo code search
    const response: FetchResponse = await (
      await fetch(`https://sgisapi.kostat.go.kr/OpenAPI3/addr/geocode.json?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      })
    ).json();
    const emdong = response.result.resultdata.map((data) => ({
      admCd: data.adm_cd,
      admNm: data.adm_nm,
      posX: data.x,
      posY: data.y,
      leg_nm: data.leg_nm,
      addr_type: data.addr_type,
    }))[0];

    // result
    const result: GetAddrGeocodeResponse = {
      success: true,
      emdong,
    };
    return res.status(200).json(result);
  } catch (error: unknown) {
    // error
    if (error instanceof Error) {
      const result = {
        success: false,
        error: {
          timestamp: Date.now().toString(),
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
    methods: ["GET"],
    handler,
    isPrivate: false,
  })
);
