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
  const terms = product?.name.split(" ").map((word) => ({ name: { contains: word } }));
  const relatedProducts = await client.product.findMany({
    take: 4,
    where: {
      OR: terms,
      AND: {
        id: {
          not: product?.id,
        },
      },
    },
  });
  const isFavorite = Boolean(
    await client.record.findFirst({
      where: {
        productId: product?.id,
        userId: user?.id,
        kind: "Favorite",
      },
      select: {
        id: true,
      },
    })
  );
  return res.status(200).json({
    success: true,
    product,
    isFavorite,
    relatedProducts,
  });
}

export default withSessionRoute(
  withHandler({
    methods: ["GET"],
    handler,
  })
);
