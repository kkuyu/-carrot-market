import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiHandler } from "next";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";

export type IronUserType = {
  id: number;
};

export type IronDummyUserType = {
  id: number;
  name: string;
  photos: "";
  emdType: "MAIN";
  MAIN_emdAddrNm: string;
  MAIN_emdPosNm: string;
  MAIN_emdPosDx: number;
  MAIN_emdPosX: number;
  MAIN_emdPosY: number;
};

export type IronSearchType = {
  history: {
    keyword: string;
    createdAt: string;
    updatedAt: string;
  }[];
  productFilter: {
    excludeSold?: boolean;
  };
};

declare module "iron-session" {
  interface IronSessionData {
    user?: IronUserType;
    dummyUser?: IronDummyUserType;
    search?: IronSearchType;
  }
}

const cookieOptions = {
  cookieName: "carrot-market-session",
  password: process.env.COOKIE_PASSWORD!,
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export function withSessionRoute(fn: NextApiHandler) {
  return withIronSessionApiRoute(fn, cookieOptions);
}

export function withSsrSession(handler: (context: GetServerSidePropsContext) => GetServerSidePropsResult<any> | Promise<GetServerSidePropsResult<any>>) {
  return withIronSessionSsr(handler, cookieOptions);
}
