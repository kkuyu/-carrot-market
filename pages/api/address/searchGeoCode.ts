import { NextApiRequest, NextApiResponse } from "next";
// @libs
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

interface GetVworldSearchGeoCodeResponse {
  response: {
    status: "OK" | "NOT_FOUND" | "ERROR";
    result: {
      items: {
        id: string;
        title: string;
        point: {
          x: string;
          y: string;
        };
      }[];
    };
  };
}

export interface GetSearchGeoCodeResponse extends ResponseDataType {
  addrNm: string;
  posX: number;
  posY: number;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { addrNm: _addrNm } = req.query;

    // invalid
    if (!_addrNm) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const query = _addrNm.toString();

    // search params
    const params = new URLSearchParams({
      query,
      service: "search",
      request: "search",
      key: process.env.VWORLD_KEY!,
      type: "district",
      category: "L4",
      refine: "false",
    }).toString();

    // fetch data
    const response: GetVworldSearchGeoCodeResponse = await (
      await fetch(`http://api.vworld.kr/req/search?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      })
    ).json();

    // result
    const result: GetSearchGeoCodeResponse = {
      success: true,
      addrNm: response.response.result.items[0].title,
      posX: +response.response.result.items[0].point.x,
      posY: +response.response.result.items[0].point.y,
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
