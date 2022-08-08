import { NextApiRequest, NextApiResponse } from "next";
import { User, Manner, ProductReview } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

export interface GetProfilesDetailResponse extends ResponseDataType {
  profile: User & { _count?: { products: number } };
  manners: (Manner & { reviews: Pick<ProductReview, "id" | "satisfaction">[] })[];
  reviews: (ProductReview & { purchaseUser?: Pick<User, "id" | "name" | "avatar">; sellUser?: Pick<User, "id" | "name" | "avatar"> })[];
}

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
    const profile = await client.user.findUnique({
      where: {
        id,
      },
      include: {
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

    // fetch manner
    const manners = await client.manner.findMany({
      where: {
        userId: profile.id,
        reviews: {
          some: {
            NOT: [{ satisfaction: "dislike" }],
          },
        },
      },
      include: {
        reviews: {
          select: {
            id: true,
            satisfaction: true,
          },
        },
      },
    });

    // fetch product review
    const reviews = await client.productReview.findMany({
      take: 3,
      orderBy: {
        createdAt: "desc",
      },
      where: {
        satisfaction: {
          not: "dislike",
        },
        text: {
          not: "",
        },
        OR: [
          { role: "sellUser", purchaseUserId: id, product: { userId: { not: id } } },
          { role: "purchaseUser", sellUserId: id, product: { userId: { equals: id } } },
        ],
      },
      include: {
        purchaseUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        sellUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // result
    const result: GetProfilesDetailResponse = {
      success: true,
      profile,
      manners: manners.sort((a, b) => b.reviews.length - a.reviews.length).splice(0, 3),
      reviews,
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
