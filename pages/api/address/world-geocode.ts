import { NextApiRequest, NextApiResponse } from "next";

import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

interface FetchResponse {
  response: {
    status: string;
    result: {
      featureCollection: {
        type: string;
        features: {
          id: string;
          type: string;
          properties: {
            full_nm: string;
            emd_kor_nm: string;
            emd_eng_nm: string;
            emd_cd: string;
          };
        }[];
      };
    };
  };
}

export interface GetWorldGeocodeResponse {
  success: boolean;
  emdongs: {
    id: string;
    addrName: string;
    admCd: null;
    admNm: null;
    posX: null;
    posY: null;
  }[];
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { address } = req.query;

    // request valid
    if (!address) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // get data props
    const addr = address.toString();
    const params = new URLSearchParams({
      service: "data",
      request: "GetFeature",
      key: process.env.VWORLD_KEY!,
      size: "20",
      page: "1",
      data: "LT_C_ADEMD_INFO",
      geometry: "false",
      attrFilter: `emd_kor_nm:like:${addr}`,
      crs: "EPSG:5179",
      domain: process.env.VWORLD_URL!,
    }).toString();

    // fetch data: geo code search
    const response: FetchResponse = await (
      await fetch(`http://api.vworld.kr/req/data?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      })
    ).json();
    const emdongs =
      response.response.status === "OK" && response.response.result.featureCollection.features.length
        ? response.response.result.featureCollection.features.map((data) => ({
            id: data.properties.emd_cd,
            addrName: data.properties.full_nm,
            admCd: null,
            admNm: null,
            posX: null,
            posY: null,
          }))
        : [];

    // result
    const result: GetWorldGeocodeResponse = {
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
    methods: ["GET"],
    handler,
    isPrivate: false,
  })
);
