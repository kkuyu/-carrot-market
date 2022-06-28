import { NextApiRequest, NextApiResponse } from "next";

import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { getAbsoluteUrl } from "@libs/utils";

interface FetchResponse {
  // 결과정보
  result: {
    sido_cd: string; // 시도코드
    sgg_cd: string; // 시군구코드
    emdong_cd: string; // 행정동코드
    emdong_nm: string; // 행정동명
    full_addr: string; // 전체주소
  }[];
}

export interface GetAddrRegeocodeResponse {
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
    const { posX, posY } = req.query;

    // request valid
    if (!posX || !posY) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // get data props
    const { origin: originUrl } = getAbsoluteUrl(req);
    const { accessToken } = await (await fetch(`${originUrl}/api/address/token`)).json();
    const x_coor = posX.toString();
    const y_coor = posY.toString();
    const params = new URLSearchParams({
      accessToken,
      x_coor,
      y_coor,
      addr_type: "20",
    }).toString();

    // fetch data: re-geo code search
    const response: FetchResponse = await (
      await fetch(`https://sgisapi.kostat.go.kr/OpenAPI3/addr/rgeocode.json?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      })
    ).json();
    const emdong = response.result.map((data) => ({
      admCd: data.sido_cd + data.sgg_cd + data.emdong_cd,
      admNm: data.emdong_nm,
      posX: x_coor,
      posY: y_coor,
    }))[0];

    // result
    const result: GetAddrRegeocodeResponse = {
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
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
