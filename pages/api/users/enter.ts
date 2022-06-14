import { NextApiRequest, NextApiResponse } from "next";

import { getRandomName } from "@libs/utils";
import client from "@libs/client/client";

import sendEmail from "@libs/server/sendEmail";
import sendMessage from "@libs/server/sendMessage";
import withHandler, { ResponseType } from "@libs/server/withHandler";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { phone, email } = req.body;
  if (!phone && !email) {
    const error = new Error("Invalid request body");
    throw error;
  }

  const name = getRandomName();
  const userPayload = {
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
  };

  const tokenPayload = Math.floor(100000 + Math.random() * 900000) + "";
  const token = await client.token.create({
    data: {
      payload: tokenPayload,
      user: {
        connectOrCreate: {
          where: {
            ...userPayload,
          },
          create: {
            name,
            ...userPayload,
          },
        },
      },
    },
  });
  if (phone) {
    sendMessage({
      messageTo: phone,
      messageContent: `Your login token is ${JSON.stringify({ ...userPayload, tokenPayload })}.`,
    });
  }
  if (email) {
    sendEmail({
      emailTo: email,
      emailSubject: "Your Carrot Market Verification Email",
      emailContent: `<div>
        <h1>Verify Your Email Address</h1>
        <p>Authentication Code : ${JSON.stringify({ ...userPayload, tokenPayload })}</p>
      </div>`,
    });
  }
  return res.status(200).json({
    success: true,
  });
}

export default withHandler({
  methods: ["POST"],
  handler,
  isPrivate: false,
});
