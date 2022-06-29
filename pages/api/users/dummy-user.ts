import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseType } from "@libs/server/withHandler";

import { getAbsoluteUrl, getRandomName } from "@libs/utils";
import { GetGeocodeDistrictResponse } from "@api/address/geocode-district";

export interface PostDummyUserResponse {
  success: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { name, addrNm, distance } = req.body;

    let dummyPayload = {
      name: "",
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

    // check data: address
    if (addrNm && distance) {
      const { origin: originUrl } = getAbsoluteUrl(req);
      const { posX, posY }: GetGeocodeDistrictResponse = await (await fetch(`${originUrl}/api/address/geocode-district?addrNm=${addrNm}`)).json();
      dummyPayload.MAIN_emdPosNm = addrNm.match(/([가-힣]+|\w+)$/g)[0];
      dummyPayload.MAIN_emdPosDx = distance;
      dummyPayload.MAIN_emdPosX = posX;
      dummyPayload.MAIN_emdPosY = posY;
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
    const result: PostDummyUserResponse = {
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
