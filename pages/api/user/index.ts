import { NextApiRequest, NextApiResponse } from "next";
import { EmdType, User, Concern, ConcernValue } from "@prisma/client";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute, IronUserType, IronDummyUserType } from "@libs/server/withSession";
// @api
import { getSearchGeoCode } from "@api/locate/searchGeoCode";

export interface GetUserResponse extends ResponseDataType {
  profile: (User & { concerns: Concern[] }) | null;
  dummyProfile: IronDummyUserType | null;
  currentAddr: {
    emdAddrNm: string | null;
    emdPosNm: string | null;
    emdPosDx: number | null;
    emdPosX: number | null;
    emdPosY: number | null;
  };
}

export interface PostUserResponse extends ResponseDataType {}

export const getUser = async (query: { user?: IronUserType; dummyUser?: IronDummyUserType }) => {
  const { user, dummyUser: _dummyUser } = query;

  const foundUser = user?.id
    ? await client.user.findUnique({
        where: {
          id: user.id,
        },
        include: {
          concerns: true,
        },
      })
    : null;
  const dummyUser = !foundUser && _dummyUser ? _dummyUser : null;

  return {
    profile: foundUser,
    dummyProfile: dummyUser,
    currentAddr: {
      emdAddrNm: foundUser?.[`${foundUser.emdType}_emdAddrNm`] ?? dummyUser?.MAIN_emdAddrNm ?? null,
      emdPosNm: foundUser?.[`${foundUser.emdType}_emdPosNm`] ?? dummyUser?.MAIN_emdPosNm ?? null,
      emdPosDx: foundUser?.[`${foundUser.emdType}_emdPosDx`] ?? dummyUser?.MAIN_emdPosDx ?? null,
      emdPosX: foundUser?.[`${foundUser.emdType}_emdPosX`] ?? dummyUser?.MAIN_emdPosX ?? null,
      emdPosY: foundUser?.[`${foundUser.emdType}_emdPosY`] ?? dummyUser?.MAIN_emdPosY ?? null,
    },
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  if (req.method === "GET") {
    try {
      const { user, dummyUser } = req.session;

      if (req?.cookies?.["carrot-market-session"] && !user && !dummyUser) {
        const error = new Error("InvalidCookie");
        error.name = "InvalidCookie";
        throw error;
      }

      // fetch data
      const { profile, dummyProfile, currentAddr } = await getUser({ user, dummyUser });

      // result
      const result: GetUserResponse = {
        success: Boolean(profile || dummyProfile),
        profile,
        dummyProfile,
        currentAddr,
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
      const { email, phone, name, photos, emdType, mainAddrNm, mainDistance, subAddrNm, subDistance, concerns: _concerns } = req.body;

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
      if (emdType && !isInstance(emdType, EmdType)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (_concerns && !Array.isArray(_concerns) && _concerns?.find((concern: string) => isInstance(concern, ConcernValue))) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // fetch data
      const foundUser = await client.user.findUnique({
        where: {
          id: user?.id,
        },
        include: {
          concerns: true,
        },
      });
      if (!foundUser) {
        const error = new Error("NotFoundUser");
        error.name = "NotFoundUser";
        throw error;
      }

      let userPayload: Partial<User> = {
        ...(name && { name }),
        ...(photos && { photos: photos.join(";") }),
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
        const { addrNm, posX, posY } = await getSearchGeoCode({
          keyword: mainAddrNm,
        });
        userPayload = {
          ...userPayload,
          MAIN_emdAddrNm: addrNm,
          MAIN_emdPosNm: addrNm.match(/(\S+)$/g)?.[0],
          MAIN_emdPosX: posX,
          MAIN_emdPosY: posY,
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
        const { addrNm, posX, posY } = await getSearchGeoCode({
          keyword: subAddrNm,
        });
        userPayload = {
          ...userPayload,
          SUB_emdAddrNm: addrNm,
          SUB_emdPosNm: addrNm.match(/(\S+)$/g)?.[0],
          SUB_emdPosX: posX,
          SUB_emdPosY: posY,
        };
      }

      // update user
      await client.user.update({
        where: {
          id: user?.id,
        },
        data: userPayload,
      });

      // disconnect concern
      await client.$transaction(
        (foundUser.concerns || [])?.map(({ id }: Concern) =>
          client.concern.update({
            where: {
              id,
            },
            data: {
              user: {
                disconnect: {
                  id: user?.id,
                },
              },
            },
          })
        )
      );

      // connect concern
      await client.$transaction(
        await (
          await client.$transaction(
            (_concerns || [])?.map((value: ConcernValue) =>
              client.concern.findFirst({
                where: { value },
              })
            )
          )
        )?.map((concern: Concern | null, index: number) =>
          client.concern.upsert({
            where: {
              id: concern?.id || 0,
            },
            create: {
              value: _concerns?.[index],
              user: {
                connect: {
                  id: user?.id,
                },
              },
            },
            update: {
              user: {
                connect: {
                  id: user?.id,
                },
              },
            },
          })
        )
      );

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
