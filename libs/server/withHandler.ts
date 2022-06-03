import { NextApiRequest, NextApiResponse } from "next";

function withHandler(method: "GET" | "POST" | "DELETE", fn: (req: NextApiRequest, res: NextApiResponse) => void) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== method) {
      return res.status(405).end();
    }
    try {
      await fn(req, res);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };
}

export default withHandler;
