import { NextApiRequest, NextApiResponse } from "next";

import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

import { getAbsoluteUrl } from "@libs/utils";

interface FetchResponse {
  features: {
    // 경계속성타입
    type: string;
    // 경계정보
    geometry: {
      type: string; // 경계타입
      coordinates: string[]; // 경계좌표
    };
    // 속성정보
    properties: {
      adm_cd: string; // 행정동코드
      adm_nm: string; // 행정동명
      x: string; // X좌표
      y: string; // Y좌표
    };
  }[];
}

export interface GetBoundarySearchResponse {
  success: boolean;
  emdongs: {
    id: string;
    addrName: string;
    admCd: string;
    admNm: string;
    posX: string;
    posY: string;
  }[];
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { latitude, longitude, distance: _distance } = req.query;

    // request valid
    if (!latitude || !longitude || !_distance) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // get data props
    const { origin: originUrl } = getAbsoluteUrl(req);
    const { accessToken } = await (await fetch(`${originUrl}/api/address/token`)).json();
    const { posX, posY } = await (await fetch(`${originUrl}/api/address/trans-coord?latitude=${latitude}&longitude=${longitude}`)).json();
    const distance = +_distance.toString();
    const params = new URLSearchParams({
      accessToken,
      minx: `${posX - distance}`,
      miny: `${posY - distance}`,
      maxx: `${posX + distance}`,
      maxy: `${posY + distance}`,
      cd: "3",
    }).toString();

    // fetch data: boundary search
    const response: FetchResponse = await (
      await fetch(`https://sgisapi.kostat.go.kr/OpenAPI3/boundary/userarea.geojson?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      })
    ).json();
    const emdongs = response.features.length
      ? response.features.map((data) => ({
          id: data.properties.adm_cd,
          addrName: data.properties.adm_nm,
          admCd: data.properties.adm_cd,
          admNm: data.properties.adm_nm,
          posX: data.properties.x,
          posY: data.properties.y,
        }))
      : [];

    // result
    const result: GetBoundarySearchResponse = {
      success: true,
      emdongs,
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
