import { NextApiRequest, NextApiResponse } from "next";
// @libs
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface CloudflareResponse {
  result: {
    id: string;
    uploadURL: string;
  };
}

export interface ImageDeliveryUpdateResponse {
  success: boolean;
  result: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
}

export interface ImageDeliveryDeleteResponse {
  success: boolean;
  result: {};
  errors?: [];
  messages?: [];
}

export interface GetFilesResponse extends ResponseDataType {
  id: string;
  uploadURL: string;
}

export interface DeleteFilesResponse extends ResponseDataType {}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  if (req.method === "GET") {
    try {
      // fetch data
      const response: CloudflareResponse = await (
        await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/images/v1/direct_upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${process.env.CF_TOKEN_IMAGE}`,
          },
        })
      ).json();

      // result
      const result: GetFilesResponse = {
        success: true,
        id: response.result.id,
        uploadURL: response.result.uploadURL,
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
  if (req.method === "DELETE") {
    try {
      const { identifier } = req.body;

      // invalid
      if (!identifier) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // fetch data
      const response = await (
        await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/images/v1/${identifier.toString()}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${process.env.CF_TOKEN_IMAGE}`,
          },
        })
      ).json();

      // result
      const result: DeleteFilesResponse = {
        success: true,
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
}

export default withSessionRoute(
  withHandler({
    methods: [
      { type: "GET", isPrivate: true },
      { type: "DELETE", isPrivate: true },
    ],
    handler,
  })
);
