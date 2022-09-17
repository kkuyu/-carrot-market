import { NextApiRequest, NextApiResponse } from "next";
// @libs
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

interface GetVworldSearchKeywordResponse {
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

export interface GetSearchKeywordResponse extends ResponseDataType {
  status: "keyword-list" | "keyword-empty";
  emdList: {
    id: string;
    addrNm: string;
    emdNm: string;
    emdCd: string;
  }[];
}

export const getSearchKeyword = async (query: { keyword: string }) => {
  const { keyword } = query;

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
    crs: "EPSG:4326",
  }).toString();

  const keywordResponse: GetVworldSearchKeywordResponse = await (
    await fetch(`http://api.vworld.kr/req/data?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
  ).json();
  console.log(`http://api.vworld.kr/req/data?${params}`);

  return {
    emdList:
      keywordResponse.response.status === "OK"
        ? keywordResponse.response.result.featureCollection.features.map((data) => ({
            id: data.properties.emd_cd,
            addrNm: data.properties.full_nm,
            emdNm: data.properties.emd_kor_nm,
            emdCd: data.properties.emd_cd,
          }))
        : [],
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

    // fetch data
    const { emdList } = await getSearchKeyword({ keyword });

    // result
    const result: GetSearchKeywordResponse = {
      success: true,
      status: emdList.length ? "keyword-list" : "keyword-empty",
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
