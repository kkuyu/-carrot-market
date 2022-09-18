import { NextApiRequest, NextApiResponse } from "next";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface PostAccountEmailTokenResponse extends ResponseDataType {}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { email, token } = req.body;

    // invalid
    if (!email || !token) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (email && !email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const foundToken = await client.token.findFirst({
      where: {
        email,
        payload: token,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
    if (!foundToken) {
      const error = new Error("인증번호를 다시 확인해주세요.");
      error.name = "InvalidToken";
      throw error;
    }
    if (!foundToken.userId) {
      const error = new Error("인증번호를 다시 확인해주세요.");
      error.name = "InvalidToken";
      throw error;
    }

    const foundUser = await client.user.update({
      where: {
        id: foundToken.userId,
      },
      data: {
        // email,
        ...(!foundToken.user?.email ? { email } : {}),
        enteredAt: new Date(),
      },
    });

    // delete token
    await client.token.deleteMany({
      where: {
        userId: foundUser?.id,
      },
    });

    // update user
    req.session.user = {
      id: foundUser?.id,
    };
    delete req.session.dummyUser;
    await req.session.save();

    // result
    const result: PostAccountEmailTokenResponse = {
      success: true,
    };
    return res.status(200).json(result);
  } catch (error: unknown) {
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
