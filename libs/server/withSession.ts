import { GetServerSidePropsContext, GetServerSidePropsResult, NextApiHandler } from "next";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import { AdmType } from "@prisma/client";

declare module "iron-session" {
  interface IronSessionData {
    user?: {
      id: number;
    };
    dummyUser: {
      id: -1;
      admType: AdmType;
      admCdMain: Number;
      admNmMain: String;
    };
    sgisApi?: {
      accessTimeout: string;
      accessToken: string;
    };
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
