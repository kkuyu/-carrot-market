import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record, Story, StoryComment, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";

export interface GetSearchResultResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  productTotalCount?: number;
  products: (Product & {
    records: Pick<Record, "id" | "kind" | "userId">[];
    chats?: (Chat & { _count: { chatMessages: number } })[];
  })[];
  storyTotalCount?: number;
  stories: (Story & {
    user: Pick<User, "id" | "name" | "avatar">;
    records: Pick<Record, "id" | "kind" | "emotion" | "userId">[];
    comments?: Pick<StoryComment, "id" | "userId" | "content">[];
  })[];
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    // result
    const result: GetSearchResultResponse = {
      success: true,
      totalCount: 0,
      lastCursor: -1,
      products: [],
      stories: [],
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
