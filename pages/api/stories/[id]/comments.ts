import { NextApiRequest, NextApiResponse } from "next";
import { Story, StoryComment, User, Record } from "@prisma/client";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";

type StoryCommentItem = StoryComment & {
  user: Pick<User, "id" | "name" | "avatar">;
  story: Pick<Story, "id" | "userId">;
  records: Pick<Record, "id" | "kind" | "userId">[];
  reComments?: StoryCommentItem[];
};

export interface GetStoriesCommentsResponse {
  success: boolean;
  comments: StoryCommentItem[];
  total: number;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

export interface PostStoriesCommentsResponse {
  success: boolean;
  comment: StoryComment;
  error?: {
    timestamp: Date;
    name: string;
    message: string;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "GET") {
    try {
      const { id: _id } = req.query;
      const { reCommentRefId: _reCommentRefId } = req.body;
      const { user } = req.session;

      // request valid
      if (!_id) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // find story detail
      const id = +_id.toString();
      const story = await client.story.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });
      if (!story) {
        const error = new Error("NotFoundStory");
        error.name = "NotFoundStory";
        throw error;
      }

      // find comment
      const makeCommentTree: (depth: number, arr: StoryCommentItem[]) => any | StoryCommentItem[] = (depth, arr) => {
        if (depth === 0) return arr;
        const copyArr = [...arr];
        for (let index = copyArr.length - 1; index >= 0; index--) {
          if (copyArr[index].depth !== depth) continue;
          if (copyArr[index].reCommentRefId === null) continue;
          const [current] = copyArr.splice(index, 1);
          const refIndex = copyArr.findIndex((item) => current.reCommentRefId === item.id);
          copyArr[refIndex].reComments?.unshift(current);
        }
        return makeCommentTree(depth - 1, copyArr);
      };
      const comments = await client.storyComment.findMany({
        where: {
          storyId: id,
          depth: {
            gte: StoryCommentMinimumDepth,
            lte: StoryCommentMaximumDepth,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          story: {
            select: {
              id: true,
              userId: true,
            },
          },
          records: {
            select: {
              id: true,
              kind: true,
              userId: true,
            },
          },
        },
      });
      const treeComments = makeCommentTree(
        Math.max(...comments.map((v) => v.depth)),
        comments.map((v) => ({ ...v, reComments: [] }))
      );

      // result
      const result: GetStoriesCommentsResponse = {
        success: true,
        comments: treeComments,
        total: comments.length,
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
    try {
      const { id: _id } = req.query;
      const { user } = req.session;
      const { comment, reCommentRefId: _reCommentRefId, emdAddrNm, emdPosNm, emdPosX, emdPosY } = req.body;

      // request valid
      if (!_id) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!comment) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (!emdAddrNm || !emdPosNm || !emdPosX || !emdPosY) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // find story detail
      const id = +_id.toString();
      const story = await client.story.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
        },
      });
      if (!story) {
        const error = new Error("NotFoundStory");
        error.name = "NotFoundStory";
        throw error;
      }

      // find reCommentRefId
      const reCommentRefId = !!_reCommentRefId ? +_reCommentRefId.toString() : null;
      const reCommentRef = reCommentRefId
        ? await client.storyComment.findUnique({
            where: {
              id: reCommentRefId,
            },
            select: {
              id: true,
              depth: true,
              storyId: true,
            },
          })
        : null;
      if (reCommentRefId && !reCommentRef) {
        const error = new Error("NotFoundComment");
        error.name = "NotFoundComment";
        throw error;
      }
      if (reCommentRefId && story.id !== reCommentRef?.storyId) {
        const error = new Error("NotFoundComment");
        error.name = "NotFoundComment";
        throw error;
      }

      // create comment
      const newComment = await client.storyComment.create({
        data: {
          comment,
          emdAddrNm,
          emdPosNm,
          emdPosX,
          emdPosY,
          user: {
            connect: {
              id: user?.id,
            },
          },
          story: {
            connect: {
              id: story.id,
            },
          },
          ...(reCommentRef
            ? {
                depth: reCommentRef.depth + 1,
                reCommentRef: {
                  connect: {
                    id: reCommentRef.id,
                  },
                },
              }
            : {}),
        },
      });

      // result
      const result: PostStoriesCommentsResponse = {
        success: true,
        comment: newComment,
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
