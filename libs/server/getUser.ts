import { IncomingMessage } from "http";
import { User } from "@prisma/client";
import { IronSessionData } from "iron-session";
// @libs
import client from "@libs/server/client";

export interface SsrUserResponse {
  success: boolean;
  profile: User | null;
  dummyProfile: IronSessionData["dummyUser"] | null;
  currentAddr: {
    emdAddrNm: string | null;
    emdPosNm: string | null;
    emdPosDx: number | null;
    emdPosX: number | null;
    emdPosY: number | null;
  };
}

const getSsrUser = async (
  req: IncomingMessage & {
    cookies: Partial<{ [key: string]: string }>;
  }
): Promise<SsrUserResponse> => {
  const foundUser = req?.session?.user?.id
    ? await client.user.findUnique({
        where: { id: req.session.user.id },
      })
    : null;
  const dummyUser = !foundUser && req.session.dummyUser ? req.session.dummyUser : null;

  return new Promise((resolve) => {
    resolve({
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
    });
  });
};

export default getSsrUser;
