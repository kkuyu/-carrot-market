import { NextApiRequest, NextApiResponse } from "next";
import { EmdType, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute, IronDummyUserType } from "@libs/server/withSession";
import { getAbsoluteUrl, isInstance } from "@libs/utils";
// @api
import { GetSearchGeoCodeResponse } from "@api/address/searchGeoCode";

export interface GetUserResponse extends ResponseDataType {
  profile: User | null;
  dummyProfile: IronDummyUserType | null;
  currentAddr: {
    emdAddrNm: string | null;
    emdPosNm: string | null;
    emdPosDx: number | null;
    emdPosX: number | null;
    emdPosY: number | null;
  };
}

export interface PostUserRequestBody {
  emdType?: EmdType;
  mainAddrNm?: string;
  mainDistance?: number;
  subAddrNm?: string | null;
  subDistance?: number | null;
}

export interface PostUserResponse extends ResponseDataType {}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  if (req.method === "GET") {
    try {
      const { user, dummyUser: _dummyUser } = req.session;

      if (req?.cookies?.["carrot-market-session"] && !user && !_dummyUser) {
        const error = new Error("InvalidCookie");
        error.name = "InvalidCookie";
        throw error;
      }

      // fetch data
      const foundUser = user?.id
        ? await client.user.findUnique({
            where: {
              id: user.id,
            },
          })
        : null;
      const dummyUser = !foundUser && _dummyUser ? _dummyUser : null;

      // result
      const result: GetUserResponse = {
        success: Boolean(foundUser || dummyUser),
        profile: foundUser,
        dummyProfile: dummyUser,
        currentAddr: {
          emdAddrNm: foundUser?.[`${foundUser.emdType}_emdAddrNm`] || dummyUser?.MAIN_emdAddrNm || null,
          emdPosNm: foundUser?.[`${foundUser.emdType}_emdPosNm`] || dummyUser?.MAIN_emdPosNm || null,
          emdPosDx: foundUser?.[`${foundUser.emdType}_emdPosDx`] || dummyUser?.MAIN_emdPosDx || null,
          emdPosX: foundUser?.[`${foundUser.emdType}_emdPosX`] || dummyUser?.MAIN_emdPosX || null,
          emdPosY: foundUser?.[`${foundUser.emdType}_emdPosY`] || dummyUser?.MAIN_emdPosY || null,
        },
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
  if (req.method === "POST") {
    try {
      const { user } = req.session;
      const { email, phone, name, photos, concerns, emdType, mainAddrNm, mainDistance, subAddrNm, subDistance } = req.body;

      // invalid
      if (JSON.stringify(req.body) === JSON.stringify({})) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (photos && !Array.isArray(photos)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (concerns && !Array.isArray(concerns)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (emdType && !isInstance(emdType, EmdType)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // fetch data
      const foundUser = await client.user.findUnique({
        where: {
          id: user?.id,
        },
      });
      if (!foundUser) {
        const error = new Error("NotFoundUser");
        error.name = "NotFoundUser";
        throw error;
      }

      let userPayload: Partial<User> = {
        ...(name && { name }),
        ...(photos && { avatar: photos.join(",") }),
        ...(concerns && { concerns: concerns.join(",") }),
      };

      // email
      if (email && email !== foundUser?.email) {
        const existed = Boolean(
          await client.user.findUnique({
            where: {
              email,
            },
            select: {
              id: true,
            },
          })
        );
        if (existed) {
          const error = new Error("This email is already in use");
          throw error;
        }
        userPayload.email = email;
      }

      // phone
      if (phone && phone !== foundUser?.phone) {
        const existed = Boolean(
          await client.user.findUnique({
            where: {
              phone,
            },
            select: {
              id: true,
            },
          })
        );
        if (existed) {
          const error = new Error("This phone number is already in use");
          throw error;
        }
        userPayload.phone = phone;
      }

      // emdType
      if (emdType) {
        userPayload = {
          ...userPayload,
          emdType,
        };
      }

      // MAIN_emdPosDx
      if (mainDistance) {
        userPayload = {
          ...userPayload,
          MAIN_emdPosDx: mainDistance,
        };
      }

      // mainAddrNm
      if (mainAddrNm) {
        const { origin: originUrl } = getAbsoluteUrl(req);
        const mainResponse: GetSearchGeoCodeResponse = await (await fetch(`${originUrl}/api/address/searchGeoCode?addrNm=${mainAddrNm}`)).json();
        if (!mainResponse.success) {
          const error = new Error("서버와 통신이 원활하지않습니다. 잠시후 다시 시도해주세요.");
          error.name = "GeoCodeDistrictError";
          throw error;
        }
        userPayload = {
          ...userPayload,
          MAIN_emdAddrNm: mainResponse.addrNm,
          MAIN_emdPosNm: mainResponse.addrNm.match(/(\S+)$/g)?.[0],
          MAIN_emdPosX: mainResponse.posX,
          MAIN_emdPosY: mainResponse.posY,
        };
      }

      // SUB_emdPosDx
      if (subDistance) {
        userPayload = {
          ...userPayload,
          SUB_emdPosDx: subDistance,
        };
      }

      // SUB_emdAddrNm, SUB_emdPosNm, SUB_emdPosX, SUB_emdPosY
      if (subAddrNm === null) {
        userPayload = {
          ...userPayload,
          SUB_emdAddrNm: null,
          SUB_emdPosNm: null,
          SUB_emdPosX: null,
          SUB_emdPosY: null,
        };
      } else if (subAddrNm) {
        const { origin: originUrl } = getAbsoluteUrl(req);
        const subResponse: GetSearchGeoCodeResponse = await (await fetch(`${originUrl}/api/address/searchGeoCode?addrNm=${subAddrNm}`)).json();
        if (!subResponse.success) {
          const error = new Error("서버와 통신이 원활하지않습니다. 잠시후 다시 시도해주세요.");
          error.name = "GeoCodeDistrictError";
          throw error;
        }
        userPayload = {
          ...userPayload,
          SUB_emdAddrNm: subResponse.addrNm,
          SUB_emdPosNm: subResponse.addrNm.match(/(\S+)$/g)?.[0],
          SUB_emdPosX: subResponse.posX,
          SUB_emdPosY: subResponse.posY,
        };
      }

      // update user
      await client.user.update({
        where: {
          id: user?.id,
        },
        data: userPayload,
      });

      // result
      const result: PostUserResponse = {
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
}

export default withSessionRoute(
  withHandler({
    methods: [
      { type: "GET", isPrivate: false },
      { type: "POST", isPrivate: true },
    ],
    handler,
  })
);
