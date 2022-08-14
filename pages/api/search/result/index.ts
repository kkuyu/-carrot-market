import { NextApiRequest, NextApiResponse } from "next";
import { Chat, Kind, Product, Record, Story, StoryComment, User } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import { withSessionRoute } from "@libs/server/withSession";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { getAbsoluteUrl } from "@libs/utils";

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
    const { prevCursor: _prevCursor, keyword: _keyword, includeSold: _includeSold, pageSize: _pageSize, posX: _posX, posY: _posY, distance: _distance } = req.query;

    // invalid
    if (!_prevCursor) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // early return result
    if (!_keyword || !_includeSold || !_posX || !_posY || !_distance) {
      const result: GetSearchResultResponse = {
        success: false,
        totalCount: 0,
        lastCursor: 0,
        products: [],
        stories: [],
      };
      return res.status(200).json(result);
    }

    const { origin: originUrl } = getAbsoluteUrl(req);
    const query = `pageSize=${4}&prevCursor=${_prevCursor}&keyword=${_keyword}&posX=${_posX}&posY=${_posY}&distance=${_distance}`;

    const productResponse: GetSearchResultResponse = await (await fetch(`${originUrl}/api/search/result/products?${query}&includeSold=${_includeSold}`)).json();
    if (!productResponse.success) {
      const error = new Error(productResponse.error?.message);
      error.name = productResponse.error?.name || "";
      throw error;
    }

    const storyResponse: GetSearchResultResponse = await (await fetch(`${originUrl}/api/search/result/stories?${query}`)).json();
    if (!storyResponse.success) {
      const error = new Error(storyResponse.error?.message);
      error.name = storyResponse.error?.name || "";
      throw error;
    }

    // result
    const result: GetSearchResultResponse = {
      success: true,
      totalCount: 0,
      lastCursor: -1,
      productTotalCount: productResponse.totalCount,
      products: productResponse.products,
      storyTotalCount: storyResponse.totalCount,
      stories: storyResponse.stories,
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
