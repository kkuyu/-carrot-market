import { NextApiRequest, NextApiResponse } from "next";
import twilio from "twilio";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { phone, email } = req.body;
  if (!phone && !email) {
    return res.status(400).json({
      success: false,
    });
  }

  const userPayload = {
    ...(phone ? { phone: +phone } : {}),
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
            name: "Anonymous",
            ...userPayload,
          },
        },
      },
    },
  });
  if (phone) {
    const message = await twilioClient.messages.create({
      messagingServiceSid: process.env.TWILIO_MSID,
      to: process.env.MY_PHONE!,
      body: `Your login token is ${JSON.stringify({ ...userPayload, tokenPayload })}.`,
    });
    console.log(message);
  }
  return res.json({
    success: true,
  });
}

export default withHandler("POST", handler);
