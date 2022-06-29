import { NextApiRequest, NextApiResponse } from "next";

import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

interface FetchResponse {
  response: {
    status: "OK" | "NOT_FOUND" | "ERROR";
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

export interface GetKeywordSearchResponse {
  success: boolean;
  emdList: {
    id: string;
    addrNm: string;
    emdNm: string;
    emdCd: string;
  }[];
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { keyword: _keyword } = req.query;

    // request valid
    if (!_keyword) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // get data props
    const keyword = _keyword.toString();
    const params = new URLSearchParams({
      service: "data",
      request: "GetFeature",
      key: process.env.VWORLD_KEY!,
      domain: process.env.VWORLD_URL!,
      size: "20",
      page: "1",
      data: "LT_C_ADEMD_INFO",
      geometry: "false",
      attrFilter: `emd_kor_nm:like:${keyword}`,
    }).toString();

    // fetch data: keyword to emdList
    const response: FetchResponse = await (
      await fetch(`http://api.vworld.kr/req/data?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      })
    ).json();
    const emdList =
      response.response.status === "OK"
        ? response.response.result.featureCollection.features.map((data) => ({
            id: data.properties.emd_cd,
            addrNm: data.properties.full_nm,
            emdNm: data.properties.emd_kor_nm,
            emdCd: data.properties.emd_cd,
          }))
        : [];

    // result
    const result: GetKeywordSearchResponse = {
      success: true,
      emdList,
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
