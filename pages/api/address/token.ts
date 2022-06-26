import { NextApiRequest, NextApiResponse } from "next";

import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

interface FetchResponse {
  result: {
    accessTimeout: string;
    accessToken: string;
  };
}

export interface GetAddressTokenResponse {
  success: boolean;
  accessTimeout: string;
  accessToken: string;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    // already a valid token exists
    if (req.session?.sgisApi && +req.session.sgisApi.accessTimeout - Date.now() > 300000) {
      return res.status(200).json({
        success: true,
        accessTimeout: req.session.sgisApi.accessTimeout,
        accessToken: req.session.sgisApi.accessToken,
      });
    }

    // fetch data: new token
    const params = new URLSearchParams({
      consumer_key: process.env.SGIS_ID!,
      consumer_secret: process.env.SGIS_KEY!,
    }).toString();
    const response: FetchResponse = await (
      await fetch(`https://sgisApi.kostat.go.kr/OpenAPI3/auth/authentication.json?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      })
    ).json();

    // save data: session.sgisApi
    req.session.sgisApi = {
      accessTimeout: response.result.accessTimeout,
      accessToken: response.result.accessToken,
    };
    await req.session.save();

    // result
    const result: GetAddressTokenResponse = {
      success: true,
      ...response.result,
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
    methods: ["GET"],
    handler,
    isPrivate: false,
  })
);
