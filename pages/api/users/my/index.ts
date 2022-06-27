import { NextApiRequest, NextApiResponse } from "next";

import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { User } from "@prisma/client";

interface GetUserResponse {
  success: boolean;
  profile: User | null;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    try {
      const { user } = req.session;

      // check user
      const foundUser = user?.id
        ? await client.user.findUnique({
            where: {
              id: user.id,
            },
          })
        : null;

      // result
      const result: GetUserResponse = {
        success: true,
        profile: foundUser,
      };
      return res.status(200).json(result);
    } catch (error: unknown) {
      // error
      if (error instanceof Error) {
        const date = Date.now().toString();
        return res.status(422).json({
          success: false,
          error: {
            timestamp: date,
            name: error.name,
            message: error.message,
          },
        });
      }
    }
  }
  if (req.method === "POST") {
    const { user } = req.session;
    const { email, phone, name, avatarId } = req.body;
    if (!phone && !email) {
      const error = new Error("Invalid request body");
      throw error;
    }
    if (!name) {
      const error = new Error("Invalid request body");
      throw error;
    }

    const currentProfile = await client.user.findUnique({
      where: {
        id: user?.id,
      },
    });
    if (email && email !== currentProfile?.email) {
      const exists = Boolean(
        await client.user.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
          },
        })
      );
      if (exists) {
        const error = new Error("This email is already in use");
        throw error;
      }
      await client.user.update({
        where: {
          id: user?.id,
        },
        data: {
          email,
        },
      });
    }
    if (phone && phone !== currentProfile?.phone) {
      const exists = Boolean(
        await client.user.findUnique({
          where: {
            phone,
          },
          select: {
            id: true,
          },
        })
      );
      if (exists) {
        const error = new Error("This phone number is already in use");
        throw error;
      }
      await client.user.update({
        where: {
          id: user?.id,
        },
        data: {
          phone,
        },
      });
    }
    if (name && name !== currentProfile?.name) {
      await client.user.update({
        where: {
          id: user?.id,
        },
        data: {
          name,
        },
      });
    }
    if (avatarId && name !== currentProfile?.avatar) {
      await client.user.update({
        where: {
          id: user?.id,
        },
        data: {
          avatar: avatarId,
        },
      });
    }
    return res.status(200).json({
      success: true,
    });
  }
}

export default withSessionRoute(
  withHandler({
    methods: [
      { type: "GET", isPrivate: false },
      { type: "POST", isPrivate: true },
    ],
    handler,
  })
);
