import { NextApiRequest, NextApiResponse } from "next";
import twilio from "twilio";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import smtpTransport from "@libs/server/email";

const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { phone, email } = req.body;
  if (!phone && !email) {
    return res.status(400).json({
      success: false,
    });
  }

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
            name: "Anonymous",
            ...userPayload,
          },
        },
      },
    },
  });
  // if (phone) {
  //   const message = await twilioClient.messages.create({
  //     messagingServiceSid: process.env.TWILIO_MSID,
  //     to: process.env.MY_PHONE!,
  //     body: `Your login token is ${JSON.stringify({ ...userPayload, tokenPayload })}.`,
  //   });
  //   console.log(message);
  // }
  // if (email) {
  //   const mailOptions = {
  //     from: process.env.MAIL_ID,
  //     to: email,
  //     subject: "Your Carrot Market Verification Email",
  //     html: `<div>
  //       <h1>Verify Your Email Address</h1>
  //       <p>Authentication Code : ${JSON.stringify({ ...userPayload, tokenPayload })}</p>
  //     </div>`,
  //   };
  //   const result = await smtpTransport.sendMail(mailOptions, (error, responses) => {
  //     if (error) {
  //       console.log(error);
  //     } else {
  //       console.log(responses);
  //     }
  //   });
  //   smtpTransport.close();
  //   console.log(result);
  // }
  return res.status(200).json({
    success: true,
  });
}

export default withHandler("POST", handler);
