import { NextApiRequest, NextApiResponse } from "next";
// @libs
import { isInstance } from "@libs/utils";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { IronSearchType, withSessionRoute } from "@libs/server/withSession";
// @api
import { GetSearchModelsResponse } from "@api/search/result/[models]/[filter]";
import { getSearchProducts } from "@api/search/result/products/[filter]";
import { getSearchStories } from "../stories/[filter]";

export type getSearchPreviewsResponse = Pick<GetSearchModelsResponse, "success" | "totalCount" | "lastCursor" | "previews" | "products" | "stories">;

export const SearchPreviewsEnum = {
  ["preview"]: "preview",
} as const;

export type SearchPreviewsEnum = typeof SearchPreviewsEnum[keyof typeof SearchPreviewsEnum];

export const getSearchPreviews = async (query: {
  searchFilter: IronSearchType["filter"];
  filter: SearchPreviewsEnum;
  prevCursor: number;
  keyword: string;
  posX: number;
  posY: number;
  distance: number;
}) => {
  const { searchFilter, filter, keyword, prevCursor, posX, posY, distance } = query;

  const searchResultProducts = await getSearchProducts({ searchFilter, filter, keyword, prevCursor, posX, posY, distance });
  const searchResultStories = await getSearchStories({ searchFilter, filter, keyword, prevCursor, posX, posY, distance });

  return {
    previews: {
      counts: { products: searchResultProducts.totalCount, stories: searchResultStories.totalCount },
    },
    products: searchResultProducts.products,
    stories: searchResultStories.stories,
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { search } = req.session;
    const { filter: _filter, keyword: _keyword, prevCursor: _prevCursor, posX: _posX, posY: _posY, distance: _distance } = req.query;

    // invalid
    if (!_filter || !_prevCursor) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // early return result
    if (!_keyword || !_posX || !_posY || !_distance) {
      const result: getSearchPreviewsResponse = {
        success: false,
        totalCount: 0,
        lastCursor: 0,
        previews: { counts: { products: 0, stories: 0 } },
        products: [],
        stories: [],
      };
      return res.status(200).json(result);
    }

    // page
    const filter = _filter.toString() as SearchPreviewsEnum;
    const prevCursor = +_prevCursor.toString();
    if (!isInstance(filter, SearchPreviewsEnum)) {
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
    const searchFilter = search?.filter ?? {};
    const keyword = _keyword.toString() || "";
    const posX = +_posX.toString();
    const posY = +_posY.toString();
    const distance = +_distance.toString();
    if (isNaN(posX) || isNaN(posY) || isNaN(distance)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const { previews, products, stories } = await getSearchPreviews({ searchFilter, filter, keyword, prevCursor, posX, posY, distance });

    // result
    const result: getSearchPreviewsResponse = {
      success: true,
      totalCount: 0,
      previews,
      products,
      stories,
      lastCursor: -1,
    };
    return res.status(200).json(result);
  } catch (error: unknown) {
    // error
    if (error instanceof Error) {
      const result = {
        success: false,
        error: {
          timestamp: Date.now().toString(),
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
