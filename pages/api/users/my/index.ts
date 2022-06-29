import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

import { EmdType, User } from "@prisma/client";
import { getAbsoluteUrl, isInstance } from "@libs/utils";
import { GetGeocodeDistrictResponse } from "@api/address/geocode-district";
import { IronSessionData } from "iron-session";

export interface GetUserResponse {
  success: boolean;
  profile: User | null;
  dummyProfile: IronSessionData["dummyUser"] | null;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

export interface PostUserResponse {
  success: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    try {
      const { user } = req.session;

      // check user
      const foundUser = user?.id
        ? await client.user.findUnique({
            where: {
              id: user.id,
            },
          })
        : null;
      const dummyUser = !foundUser && req.session.dummyUser ? req.session.dummyUser : null;

      // result
      const result: GetUserResponse = {
        success: true,
        profile: foundUser,
        dummyProfile: dummyUser,
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
      const { email, phone, name, avatarId, emdType, distance, addrNm } = req.body;

      // request valid
      if (!email && !phone && !name && !avatarId && !emdType) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (emdType) {
        if (!isInstance(emdType, EmdType)) {
          const error = new Error("InvalidRequestBody");
          error.name = "InvalidRequestBody";
          throw error;
        }
        if (!addrNm || !distance) {
          const error = new Error("InvalidRequestBody");
          error.name = "InvalidRequestBody";
          throw error;
        }
      }

      // check user
      const foundUser = user?.id
        ? await client.user.findUnique({
            where: {
              id: user.id,
            },
          })
        : null;
      if (!foundUser) {
        const error = new Error("NotFoundUser");
        error.name = "NotFoundUser";
        throw error;
      }

      let userPayload: Partial<User> = {
        ...(name && { name }),
        ...(avatarId && { avatar: avatarId }),
      };

      // check data: email
      if (email && email !== foundUser?.email) {
        const exists = Boolean(
          await client.user.findUnique({
            where: {
              email,
            },
            select: {
              id: true,
            },
          })
        );
        if (exists) {
          const error = new Error("This email is already in use");
          throw error;
        }
        userPayload.email = email;
      }

      // check data: phone number
      if (phone && phone !== foundUser?.phone) {
        const exists = Boolean(
          await client.user.findUnique({
            where: {
              phone,
            },
            select: {
              id: true,
            },
          })
        );
        if (exists) {
          const error = new Error("This phone number is already in use");
          throw error;
        }
        userPayload.phone = phone;
      }

      // check data: address
      if (emdType && addrNm) {
        const { origin: originUrl } = getAbsoluteUrl(req);
        const { posX, posY }: GetGeocodeDistrictResponse = await (await fetch(`${originUrl}/api/address/geocode-district?addrNm=${addrNm}`)).json();
        userPayload = {
          ...userPayload,
          emdType,
          [`${emdType}_emdPosNm`]: addrNm.match(/([가-힣]+|\w+)$/g)[0],
          [`${emdType}_emdPosDx`]: distance,
          [`${emdType}_emdPosX`]: posX,
          [`${emdType}_emdPosY`]: posY,
        };
      }

      // update data: client.user
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
