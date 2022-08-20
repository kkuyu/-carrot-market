import { NextApiRequest, NextApiResponse } from "next";
import { SearchRecord } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import { withSessionRoute, IronSearchType } from "@libs/server/withSession";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";

export interface GetSearchResponse extends ResponseDataType {
  history: IronSearchType["history"];
  productFilter: IronSearchType["productFilter"];
  records: Pick<SearchRecord, "id" | "keyword">[];
}

export interface PostSearchResponse extends ResponseDataType {
  history: IronSearchType["history"];
  productFilter: IronSearchType["productFilter"];
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  if (req.method === "GET") {
    try {
      // fetch data
      const records = await client.searchRecord.findMany({
        take: 10,
        orderBy: [{ count: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          keyword: true,
        },
      });

      // result
      const result: GetSearchResponse = {
        success: true,
        history: [...(req?.session?.search?.history || [])].reverse(),
        productFilter: { ...req?.session?.search?.productFilter },
        records,
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
  if (req.method === "POST") {
    try {
      const { user, search } = req.session;
      const { keyword: _keyword, excludeSold: _excludeSold } = req.body;

      // invalid
      if (typeof _keyword === "undefined" && typeof _excludeSold === "undefined") {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // params
      const keyword = _keyword?.toString() || "";
      const excludeSold = typeof _excludeSold !== "undefined" ? JSON.parse(_excludeSold.toString()) : undefined;

      let searchPayload = {
        history: [...(search?.history || [])],
        productFilter: { ...search?.productFilter },
      };

      // keyword
      if (keyword.length) {
        // update searchPayload
        const history = [...(search?.history || [])];
        const currentDate = new Date().toString();
        const idx = history.findIndex((record) => record.keyword === keyword);
        if (idx === -1) {
          history.push({ keyword, createdAt: currentDate, updatedAt: currentDate });
        } else {
          const existed = history.splice(idx, 1);
          history.push({ ...existed[0], updatedAt: currentDate });
        }
        searchPayload.history = history.slice(-10);

        // update searchRecord
        const [existed] = await client.searchRecord.findMany({
          where: {
            keyword,
          },
          select: {
            id: true,
            count: true,
          },
        });
        if (user?.id && existed) {
          await client.searchRecord.update({
            where: {
              id: existed.id,
            },
            data: {
              count: existed.count + 1,
              user: {
                connect: {
                  id: user.id,
                },
              },
            },
          });
        } else if (user?.id && !existed) {
          await client.searchRecord.create({
            data: {
              count: 1,
              keyword,
              user: {
                connect: {
                  id: user.id,
                },
              },
            },
          });
        }
      }

      // excludeSold
      if (typeof excludeSold === "boolean") {
        // update searchPayload
        searchPayload.productFilter.excludeSold = excludeSold;
      }

      // update req.session.search
      req.session.search = { ...searchPayload };
      await req.session.save();

      // result
      const result: PostSearchResponse = {
        success: true,
        history: [...searchPayload.history].reverse(),
        productFilter: searchPayload.productFilter,
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
}

export default withSessionRoute(
  withHandler({
    methods: [
      { type: "GET", isPrivate: false },
      { type: "POST", isPrivate: false },
    ],
    handler,
  })
);
