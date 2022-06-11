import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/client/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  const { id } = req.query;
  const { user } = req.session;
  const cleanId = +id?.toString()!;
  const product = await client.product.findUnique({
    where: {
      id: cleanId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
  if (!product) {
    const error = new Error("Not found product");
    throw error;
  }
  const exists = await client.favorite.findFirst({
    where: {
      userId: user?.id,
      productId: cleanId,
    },
    select: {
      id: true,
    },
  });
  if (exists) {
    await client.favorite.delete({
      where: {
        id: exists.id,
      },
    });
  }
  if (!exists) {
    await client.favorite.create({
      data: {
        user: {
          connect: {
            id: user?.id,
          },
        },
        product: {
          connect: {
            id: cleanId,
          },
        },
      },
    });
  }
  return res.status(200).json({
    success: true,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["POST"],
    handler,
  })
);
