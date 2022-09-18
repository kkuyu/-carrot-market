import { NextApiRequest, NextApiResponse } from "next";
// @libs
import { isInstance } from "@libs/utils";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { CoordsStateEnum } from "@libs/client/useCoords";

interface GetVworldSearchBoundaryResponse {
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

export interface GetSearchBoundaryResponse extends ResponseDataType {
  status: "boundary-undefined" | "boundary-list" | "boundary-empty";
  totalCount: number;
  emdList: {
    id: string;
    addrNm: string;
    emdNm: string;
    emdCd: string;
  }[];
}

export const getSearchBoundary = async (query: { state: string; posX: number; posY: number; distance: number }) => {
  const { state, posX, posY, distance } = query;

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

  const boundaryResponse: GetVworldSearchBoundaryResponse = await (
    await fetch(`http://api.vworld.kr/req/data?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
  ).json();

  return {
    totalCount: boundaryResponse?.response?.record?.total,
    emdList:
      boundaryResponse?.response?.status === "OK"
        ? boundaryResponse?.response?.result?.featureCollection?.features
            ?.map((data) => ({
              id: data?.properties?.emd_cd,
              addrNm: data?.properties?.full_nm,
              emdNm: data?.properties?.emd_kor_nm,
              emdCd: data?.properties?.emd_cd,
            }))
            .reverse()
        : [],
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { state: _state, posX: _posX, posY: _posY, distance: _distance } = req.query;

    // invalid
    if (!_state || !_posX || !_posY || !_distance) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const state = _state.toString();
    const posX = +_posX.toString();
    const posY = +_posY.toString();
    const distance = +_distance.toString();
    if (!isInstance(state, CoordsStateEnum)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (isNaN(posX) || isNaN(posY) || isNaN(distance)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // early return result
    if (state === "loading" || state === "denied" || state === "error") {
      // result
      const result: GetSearchBoundaryResponse = {
        success: true,
        status: "boundary-undefined",
        totalCount: 0,
        emdList: [],
      };
      return res.status(200).json(result);
    }

    // fetch data
    const { totalCount, emdList } = await getSearchBoundary({ state, posX, posY, distance });

    // result
    const result: GetSearchBoundaryResponse = {
      success: true,
      totalCount,
      status: emdList.length ? "boundary-list" : "boundary-empty",
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
