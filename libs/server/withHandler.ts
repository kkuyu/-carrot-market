import { NextApiRequest, NextApiResponse } from "next";

export interface ResponseType {
  success: boolean;
  [key: string]: any;
}

type method = "GET" | "POST" | "DELETE";

interface ConfigType {
  methods: method[];
  handler: (req: NextApiRequest, res: NextApiResponse) => void;
  isPrivate?: boolean;
}

function withHandler({ methods, handler, isPrivate = true }: ConfigType) {
  return async function (req: NextApiRequest, res: NextApiResponse): Promise<any> {
    if (req.method && !methods.includes(req.method as any)) {
      return res.status(405).end();
    }
    if (isPrivate && !req.session.user) {
      return res.status(401).json({
        success: false,
        error: "Please login",
      });
    }
    try {
      await handler(req, res);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        res.status(500).json({
          error: error.message,
        });
      } else {
        res.status(500).json({
          error: "Internal Server Error",
        });
      }
    }
  };
}

export default withHandler;
