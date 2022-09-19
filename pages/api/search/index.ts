import { NextApiRequest, NextApiResponse } from "next";
import { Search } from "@prisma/client";
// @libs
import client from "@libs/server/client";
import { withSessionRoute, IronSearchType } from "@libs/server/withSession";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";

export interface GetSearchResponse extends ResponseDataType {
  searches: Pick<Search, "id" | "keyword">[];
  history: IronSearchType["history"];
  filter: IronSearchType["filter"];
}

export interface PostSearchResponse extends ResponseDataType {
  history: IronSearchType["history"];
  filter: IronSearchType["filter"];
}

export const getSearch = async (query: { search?: IronSearchType }) => {
  const { search } = query;

  const searches = await client.search.findMany({
    take: 10,
    orderBy: [{ searchKeywords: { _count: "desc" } }, { updatedAt: "desc" }],
    select: {
      id: true,
      keyword: true,
    },
  });

  const history = [...(search?.history || [])];
  const filter = search?.filter ?? {};

  return {
    history: history.reverse(),
    filter,
    searches: searches.length ? searches : [{ id: 0, keyword: "당근마켓" }],
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  if (req.method === "GET") {
    try {
      const { search } = req.session;

      // fetch data
      const { searches, history, filter } = await getSearch({
        search,
      });

      // result
      const result: GetSearchResponse = {
        success: true,
        searches,
        history,
        filter,
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
      const { searchKeyword: keyword = "", searchFilter = {}, emdAddrNm, emdPosNm, emdPosX, emdPosY } = req.body;

      // invalid
      if (!keyword && !Object.keys(searchFilter)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (keyword && (!emdAddrNm || !emdPosNm || !emdPosX || !emdPosY)) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // params
      const currentDate = new Date();
      let history = [...(search?.history || [])];
      let filter = search?.filter ?? {};

      // fetch user
      const foundUser = await client.user.findUnique({
        where: {
          id: user?.id,
        },
        select: {
          id: true,
        },
      });

      // keyword
      if (keyword.length && keyword !== history?.[history.length - 1]?.keyword) {
        // update history
        const index = history.findIndex((record) => record.keyword === keyword);
        if (index === -1) {
          history.push({ keyword, createdAt: currentDate.toString(), updatedAt: currentDate.toString() });
        } else {
          const existed = history.splice(index, 1);
          history.push({ ...existed[0], updatedAt: currentDate.toString() });
        }
        history.splice(0, history.length - 10);
        // update SearchKeyword
        const searchKeyword = await client.searchKeyword.create({
          data: {
            keyword,
            emdAddrNm,
            emdPosNm,
            emdPosX,
            emdPosY,
            search: {
              connectOrCreate: {
                where: {
                  keyword,
                },
                create: {
                  keyword,
                },
              },
            },
            user: {
              ...(foundUser ? { connect: { id: foundUser?.id } } : null),
            },
          },
        });
        await client.search.update({
          where: {
            id: searchKeyword.searchId,
          },
          data: {
            updatedAt: new Date(),
          },
        });
      }

      // filter
      if (Object.keys(searchFilter)) {
        // update filter
        filter = { ...filter, ...searchFilter };
      }

      // update req.session.search
      req.session.search = { history, filter };
      await req.session.save();

      // result
      const result: PostSearchResponse = {
        success: true,
        history: history.reverse(),
        filter,
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
