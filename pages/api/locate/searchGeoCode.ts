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

export const getSearchGeoCode = async (query: { keyword: string }) => {
  const { keyword } = query;

  const params = new URLSearchParams({
    query: keyword,
    service: "search",
    request: "search",
    key: process.env.VWORLD_KEY!,
    type: "district",
    category: "L4",
    refine: "false",
  }).toString();

  const geoCodeResponse: GetVworldSearchGeoCodeResponse = await (
    await fetch(`http://api.vworld.kr/req/search?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
  ).json();

  return {
    addrNm: geoCodeResponse.response.result.items[0].title,
    posX: +geoCodeResponse.response.result.items[0].point.x,
    posY: +geoCodeResponse.response.result.items[0].point.y,
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { keyword: _keyword } = req.query;

    // invalid
    if (!_keyword) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const keyword = _keyword.toString();

    //  fetch data
    const { addrNm, posX, posY } = await getSearchGeoCode({ keyword });

    // result
    const result: GetSearchGeoCodeResponse = {
      success: true,
      addrNm,
      posX,
      posY,
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
