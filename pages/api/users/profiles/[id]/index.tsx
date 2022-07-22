import { NextApiRequest, NextApiResponse } from "next";
import { User, Manner, Review } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProfilesDetailResponse {
  success: boolean;
  profile: User & {
    manners: Pick<Manner, "id" | "count" | "value">[];
    sellUserReview: (Review & { sellUser: Pick<User, "id" | "name" | "avatar">; purchaseUser: Pick<User, "id" | "name" | "avatar"> })[];
    purchaseUserReview: (Review & { sellUser: Pick<User, "id" | "name" | "avatar">; purchaseUser: Pick<User, "id" | "name" | "avatar"> })[];
    _count?: { products: number };
  };
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  try {
    const { id: _id } = req.query;

    // request valid
    if (!_id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // find profile detail
    const id = +_id.toString();
    const profile = await client.user.findUnique({
      where: {
        id,
      },
      include: {
        manners: {
          take: 3,
          orderBy: {
            count: "desc",
          },
          where: {
            reviews: {
              none: {
                satisfaction: "dislike",
              },
            },
          },
          select: {
            id: true,
            value: true,
            count: true,
          },
        },
        sellUserReview: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          where: {
            satisfaction: {
              not: "dislike",
            },
          },
          include: {
            sellUser: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            purchaseUser: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        purchaseUserReview: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          where: {
            satisfaction: {
              not: "dislike",
            },
          },
          include: {
            sellUser: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            purchaseUser: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
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
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
