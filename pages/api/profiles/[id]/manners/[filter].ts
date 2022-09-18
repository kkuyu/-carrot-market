import { NextApiRequest, NextApiResponse } from "next";
// @libs
import { isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { GetProfilesModelsResponse } from "@api/profiles/[id]/[models]/[filter]";

export type GetProfilesMannersResponse = Pick<GetProfilesModelsResponse, "success" | "totalCount" | "lastCursor" | "manners">;

export const ProfileMannersEnum = {
  ["all"]: "all",
  ["preview"]: "preview",
} as const;

export type ProfileMannersEnum = typeof ProfileMannersEnum[keyof typeof ProfileMannersEnum];

export const getProfilesManners = async (query: { filter: ProfileMannersEnum; id: number; prevCursor: number; userId?: number }) => {
  const { filter, id, prevCursor, userId } = query;

  const manners = await client.manner.findMany({
    where: {
      userId: id,
      ...((filter === "preview" || id !== userId) && {
        reviews: { every: { score: { gt: 40 } } },
      }),
    },
    skip: prevCursor ? 1 : 0,
    ...(prevCursor && { cursor: { id: prevCursor } }),
    ...(filter === "preview" && { take: 3 }),
    orderBy: {
      reviews: {
        _count: "desc",
      },
    },
    include: {
      reviews: {
        select: {
          score: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });

  return {
    manners: manners
      .filter(({ reviews, ...manner }) => !Boolean(reviews.find((review) => review.score <= 40 && id === userId && manner._count.reviews < 2)))
      .map(({ reviews, ...manner }) => ({ ...manner, isRude: Boolean(reviews.find((review) => review.score <= 40)) })),
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  const { filter: _filter, id: _id, prevCursor: _prevCursor } = req.query;
  const { user } = req.session;

  // invalid
  if (!_filter || !_id || !_prevCursor) {
    const error = new Error("InvalidRequestBody");
    error.name = "InvalidRequestBody";
    throw error;
  }

  // params
  const filter = _filter.toString() as ProfileMannersEnum;
  const prevCursor = +_prevCursor.toString();
  if (!isInstance(filter, ProfileMannersEnum)) {
    const error = new Error("InvalidRequestBody");
    error.name = "InvalidRequestBody";
    throw error;
  }
  if (isNaN(prevCursor) || prevCursor === -1) {
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
  const { manners } = await getProfilesManners({ filter, id, prevCursor, userId: user?.id });

  // result
  const result: GetProfilesMannersResponse = {
    success: true,
    totalCount: 0,
    lastCursor: -1,
    manners,
  };
  return res.status(200).json(result);
}

export default withSessionRoute(
  withHandler({
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
