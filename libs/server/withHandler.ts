import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

export interface ResponseDataType {
  success: boolean;
  [key: string]: any;
  error?: {
    timestamp: string;
    name: string;
    message: string;
  };
}

interface ConfigType {
  methods: { type: "GET" | "POST" | "DELETE"; isPrivate?: boolean }[];
  handler: NextApiHandler<any>;
}

const withHandler: (config: ConfigType) => NextApiHandler<any> = ({ methods, handler }) => {
  return async (req, res) => {
    try {
      const method = methods.find((method) => method.type === req.method);
      if (req.method && !method) {
        const error = new Error("MethodTypeError");
        error.name = "MethodTypeError";
        throw error;
      }
      if (method?.isPrivate && !req.session.user) {
        const error = new Error("InaccessibleError");
        error.name = "InaccessibleError";
        throw error;
      }
      await handler(req, res);
    } catch (error) {
      // error
      if (error instanceof Error) {
        const date = Date.now().toString();
        return res.status(500).json({
          success: false,
          error: {
            timestamp: date,
            name: error.name,
            message: error.message,
          },
        });
      }
    }
  };
};

export default withHandler;
