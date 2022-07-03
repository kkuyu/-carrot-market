import { NextApiRequest, NextApiResponse } from "next";

import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface CloudflareResponse {
  result: {
    id: string;
    uploadURL: string;
  };
}

export interface ImageDeliveryResponse {
  success: boolean;
  result: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
}

export interface GetFileResponse {
  success: boolean;
  id: string;
  uploadURL: string;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    // get cloudflare file data
    const response: CloudflareResponse = await (
      await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/images/v1/direct_upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CF_TOKEN_IMAGE}`,
          
        },
      })
    ).json();

    // result
    const result: GetFileResponse = {
      success: true,
      id: response.result.id,
      uploadURL: response.result.uploadURL,
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
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
