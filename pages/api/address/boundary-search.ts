import { NextApiRequest, NextApiResponse } from "next";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

interface FetchResponse {
  response: {
    status: string;
    record: {
      total: number;
      current: number;
    };
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

export interface GetBoundarySearchResponse {
  success: boolean;
  emdList: {
    id: string;
    addrNm: string;
    emdNm: string;
    emdCd: string;
  }[];
  record: {
    total: number;
    current: number;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { posX: _posX, posY: _posY, distance: _distance = 0 } = req.query;

    // request valid
    if (!_posX || !_posY) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // get data props
    const posX = +_posX.toString();
    const posY = +_posY.toString();
    const distance = +_distance.toString();
    const params = new URLSearchParams({
      service: "data",
      request: "GetFeature",
      key: process.env.VWORLD_KEY!,
      domain: process.env.VWORLD_URL!,
      size: "20",
      page: "1",
      data: "LT_C_ADEMD_INFO",
      geometry: "false",
      geomFilter: distance === 0 ? `point(${posX} ${posY})` : `box(${posX - distance}, ${posY - distance}, ${posX + distance}, ${posY + distance})`,
      crs: "EPSG:4326",
    }).toString();

    // fetch data: geomFilter to emdList
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
        ? response.response.result.featureCollection.features
            .map((data) => ({
              id: data.properties.emd_cd,
              addrNm: data.properties.full_nm,
              emdNm: data.properties.emd_kor_nm,
              emdCd: data.properties.emd_cd,
            }))
            .reverse()
        : [];

    // result
    const result: GetBoundarySearchResponse = {
      success: true,
      emdList,
      record: response.response.record,
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
