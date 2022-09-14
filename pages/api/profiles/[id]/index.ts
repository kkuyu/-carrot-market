import { NextApiRequest, NextApiResponse } from "next";
import { User, Manner, Review, Concern } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProfilesDetailResponse extends ResponseDataType {
  profile: User & { concerns?: Concern[]; _count?: { products: number } };
}

export const getProfilesDetail = async (query: { id: number }) => {
  const { id } = query;

  const profile = await client.user.findUnique({
    where: {
      id,
    },
    include: {
      concerns: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return { profile };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id } = req.query;

    // invalid
    if (!_id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const id = +_id.toString();
    if (isNaN(id)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const { profile } = await getProfilesDetail({ id });
    if (!profile) {
      const error = new Error("NotFoundProfile");
      error.name = "NotFoundProfile";
      throw error;
    }

    // result
    const result: GetProfilesDetailResponse = {
      success: true,
      profile,
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
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
