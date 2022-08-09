import { NextApiRequest, NextApiResponse } from "next";
// @libs
import client from "@libs/server/client";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";

export interface PostUserLogoutResponse extends ResponseDataType {
  isExisted: boolean;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { user, dummyUser } = req.session;

    // fetch data
    const userData = user?.id
      ? await client.user.findFirst({
          where: {
            id: user?.id,
          },
          select: {
            id: true,
          },
        })
      : null;

    delete req.session.user;
    delete req.session.dummyUser;
    await req.session.save();
    await req.session.destroy();

    // result
    const result: PostUserLogoutResponse = {
      success: true,
      isExisted: Boolean(userData || dummyUser),
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
