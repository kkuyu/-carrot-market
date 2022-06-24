import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import sendMessage from "@libs/server/sendMessage";
import withHandler, { ResponseType } from "@libs/server/withHandler";

export interface PostUserUpdateResponse {
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

    await client.user.update({
      where: {
        id: foundUser.id,
      },
      data: {
        ...(updateData.avatarId ? { avatarId: updateData.avatarId } : {}),
        ...(updateData.name ? { name: updateData.name } : {}),
        ...(updateData.phone ? { phone: updateData.phone } : {}),
        ...(updateData.email ? { email: updateData.email } : {}),
      },
    });

    return res.status(200).json({
      success: true,
    });
  } catch (error: unknown) {
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

export default withHandler({
  methods: ["POST"],
  handler,
  isPrivate: false,
});
