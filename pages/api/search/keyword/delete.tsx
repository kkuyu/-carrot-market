import { NextApiRequest, NextApiResponse } from "next";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute, IronSearchType } from "@libs/server/withSession";

export interface PostSearchKeywordDeleteResponse extends ResponseDataType {
  history: IronSearchType["history"];
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { keywords = [] } = req.body;
    const { search } = req.session;

    // invalid
    if (keywords && !Array.isArray(keywords)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    let history = [...(search?.history || [])];
    let filter = search?.filter ?? {};

    // delete keyword
    history = history.filter((record) => !keywords.includes(record.keyword));

    // save session.search.history
    if (req.session.search) {
      req.session.search.history = history;
      await req.session.save();
    }

    // result
    const result: PostSearchKeywordDeleteResponse = {
      success: true,
      history: history.reverse(),
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
    methods: [{ type: "POST", isPrivate: false }],
    handler,
  })
);
