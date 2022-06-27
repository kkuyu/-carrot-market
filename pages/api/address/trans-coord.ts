import { NextApiRequest, NextApiResponse } from "next";

import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

import { getAbsoluteUrl } from "@libs/utils";

interface FetchResponse {
  result: {
    toSrs: string; // 변환된 좌표체계
    posX: String;
    posY: String;
  };
}

export interface GetTransCoordResponse {
  success: boolean;
  lat: number;
  lon: number;
  posX: number;
  posY: number;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { latitude, longitude } = req.query;

    // request valid
    if (!latitude || !longitude) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // get data props
    const lat = latitude.toString() !== "0" ? latitude.toString().replace(/^(\d*\.\d{0,3})(\d*)$/, (_, p1) => p1) : "37.566";
    const lon = longitude.toString() !== "0" ? longitude.toString().replace(/^(\d*\.\d{0,3})(\d*)$/, (_, p1) => p1) : "37.566";
    const { origin: originUrl } = getAbsoluteUrl(req);
    const { accessToken } = await (await fetch(`${originUrl}/api/address/token`)).json();

    // fetch data
    const params = new URLSearchParams({
      accessToken,
      src: "4326",
      dst: "5179",
      posX: lon,
      posY: lat,
    }).toString();
    const response: FetchResponse = await (
      await fetch(`https://sgisapi.kostat.go.kr/OpenAPI3/transformation/transcoord.json?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      })
    ).json();

    // result
    const result: GetTransCoordResponse = {
      success: true,
      lat: +lat,
      lon: +lon,
      posX: +response.result.posX,
      posY: +response.result.posY,
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

export default withSessionRoute(
  withHandler({
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
