import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostVerificationUpdateResponse {
  success: boolean;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { originData, updateData } = req.body;

    // request valid
    if (!originData || !updateData) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // user check
    const foundUser = await client.user.findUnique({
      where: {
        ...(originData.phone ? { phone: originData.phone } : {}),
        ...(originData.email ? { email: originData.email } : {}),
      },
      select: {
        id: true,
      },
    });
    if (!foundUser) {
      const error = new Error("기존 계정 정보를 다시 확인해주세요.");
      error.name = "NotFoundUser";
      throw error;
    }

    // update data: client.user
    await client.user.update({
      where: {
        id: foundUser.id,
      },
      data: {
        ...(updateData.phone ? { phone: updateData.phone } : {}),
        ...(updateData.email ? { email: updateData.email } : {}),
      },
    });

    // result
    const result: PostVerificationUpdateResponse = {
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
