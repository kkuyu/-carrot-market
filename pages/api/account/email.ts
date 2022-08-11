import { NextApiRequest, NextApiResponse } from "next";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { EmailTemplateKey } from "@libs/server/getUtilsNcp";
import sendEmail from "@libs/server/sendEmail";

export interface PostAccountEmailResponse extends ResponseDataType {}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { user } = req.session;
    const { email } = req.body;

    // invalid
    if (!email || !email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const foundUser = await client.user.findUnique({
      where: {
        id: user?.id,
      },
      select: {
        id: true,
        email: true,
      },
    });
    if (!foundUser) {
      const error = new Error("계정 정보를 다시 확인해주세요.");
      error.name = "NotFoundUser";
      throw error;
    }
    if (foundUser && foundUser.email === email) {
      const error = new Error("등록된 이메일 주소와 같은 주소예요. 변경하실 이메일 주소를 입력해주세요.");
      error.name = "SameAccount";
      throw error;
    }

    // fetch user
    const foundUserByEmail = await client.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });
    if (foundUserByEmail) {
      const error = new Error("이미 가입한 휴대폰 번호예요. 휴대폰 번호를 다시 확인해주세요.");
      error.name = "AlreadyRegisteredAccount";
      throw error;
    }

    // create token
    const newToken = await client.token.create({
      data: {
        payload: Math.floor(100000 + Math.random() * 900000) + "",
        user: {
          connect: {
            id: foundUser.id,
          },
        },
      },
    });

    // send email
    sendEmail({
      sendTo: email,
      templateId: EmailTemplateKey.accountEmail,
      parameters: {
        token: newToken.payload,
      },
    });

    // result
    const result: PostAccountEmailResponse = {
      success: true,
    };
    return res.status(200).json(result);
  } catch (error: unknown) {
    // error
    if (error instanceof Error) {
      const date = Date.now().toString();
      const result = {
        success: false,
        error: {
          timestamp: date,
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
    methods: [{ type: "POST", isPrivate: false }],
    handler,
  })
);
