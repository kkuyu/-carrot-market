import { NextApiRequest, NextApiResponse } from "next";
// @libs
import { getAbsoluteUrl, getRandomName } from "@libs/utils";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
// @api
import { GetSearchGeoCodeResponse } from "@api/address/searchGeoCode";

export interface PostDummyResponse extends ResponseDataType {}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
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

    // name
    if (name) {
      dummyPayload.name = name;
    } else if (dummyPayload.name === "") {
      dummyPayload.name = getRandomName();
    }

    // MAIN_emdPosDx
    if (mainDistance) {
      dummyPayload = {
        ...dummyPayload,
        MAIN_emdPosDx: mainDistance,
      };
    }

    // mainAddrNm
    if (mainAddrNm && Boolean(!mainPosX && !mainPosY)) {
      const { origin: originUrl } = getAbsoluteUrl(req);
      const mainResponse: GetSearchGeoCodeResponse = await (await fetch(`${originUrl}/api/address/searchGeoCode?addrNm=${mainAddrNm}`)).json();
      if (!mainResponse.success) {
        const error = new Error("서버와 통신이 원활하지않습니다. 잠시후 다시 시도해주세요.");
        error.name = "GeoCodeDistrictError";
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

    // update dummyUser
    req.session.dummyUser = {
      id: -1,
      avatar: "",
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
      const result = {
        success: false,
        error: {
          timestamp: date,
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
    methods: [{ type: "POST", isPrivate: false }],
    handler,
  })
);
