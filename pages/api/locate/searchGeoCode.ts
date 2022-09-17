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
    version: "2.0",
    service: "search",
    request: "search",
    key: process.env.VWORLD_KEY!,
    size: "5",
    page: "1",
    type: "district",
    category: "L4",
    query: keyword,
    crs: "EPSG:4326",
  }).toString();

  const geoCodeResponse: GetVworldSearchGeoCodeResponse = await (
    await fetch(`http://api.vworld.kr/req/search?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
  ).json();

  const locate = geoCodeResponse.response.result.items.find((item) => item.title === keyword) ?? null;

  return {
    addrNm: locate?.title || "",
    posX: +(locate?.point?.x || 0),
    posY: +(locate?.point?.y || 0),
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
      success: Boolean(addrNm),
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
