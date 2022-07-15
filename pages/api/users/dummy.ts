import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseType } from "@libs/server/withHandler";

import { getAbsoluteUrl, getRandomName } from "@libs/utils";
import { GetGeocodeDistrictResponse } from "@api/address/geocode-district";

export interface PostDummyResponse {
  success: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { name, mainAddrNm, mainPosX, mainPosY, mainDistance } = req.body;

    let dummyPayload = {
      name: "",
      MAIN_emdAddrNm: "",
      MAIN_emdPosNm: "",
      MAIN_emdPosDx: 0,
      MAIN_emdPosX: 0,
      MAIN_emdPosY: 0,
      ...req.session.dummyUser,
    };

    // check data: name
    if (name) {
      dummyPayload.name = name;
    } else if (dummyPayload.name === "") {
      dummyPayload.name = getRandomName();
    }

    // check data: main address
    if (mainDistance) {
      dummyPayload = {
        ...dummyPayload,
        MAIN_emdPosDx: mainDistance,
      };
    }

    if (mainAddrNm && Boolean(!mainPosX && !mainPosY)) {
      const { origin: originUrl } = getAbsoluteUrl(req);
      const mainResponse: GetGeocodeDistrictResponse = await (await fetch(`${originUrl}/api/address/geocode-district?addrNm=${mainAddrNm}`)).json();
      if (!mainResponse.success) {
        const error = new Error("서버와 통신이 원활하지않습니다. 잠시후 다시 시도해주세요.");
        error.name = "GeocodeDistrictError";
        throw error;
      }
      dummyPayload = {
        ...dummyPayload,
        MAIN_emdAddrNm: mainResponse.addrNm,
        MAIN_emdPosNm: mainResponse.addrNm.match(/(\S+)$/g)?.[0] || "",
        MAIN_emdPosX: mainResponse.posX,
        MAIN_emdPosY: mainResponse.posY,
      };
    } else if (mainAddrNm && Boolean(mainPosX && mainPosY)) {
      dummyPayload = {
        ...dummyPayload,
        MAIN_emdAddrNm: mainAddrNm,
        MAIN_emdPosNm: mainAddrNm.match(/(\S+)$/g)?.[0],
        MAIN_emdPosX: mainPosX,
        MAIN_emdPosY: mainPosY,
      };
    }

    // update data: session.dummyUser
    req.session.dummyUser = {
      id: -1,
      emdType: "MAIN",
      ...dummyPayload,
    };
    delete req.session.user;
    await req.session.save();

    // result
    const result: PostDummyResponse = {
      success: true,
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
    methods: [{ type: "POST", isPrivate: false }],
    handler,
  })
);
