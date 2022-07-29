import { NextApiRequest, NextApiResponse } from "next";
import { Story, StoryComment, User, Record } from "@prisma/client";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth } from "@api/stories/types";
// @libs
import client from "@libs/server/client";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
import { getAbsoluteUrl } from "@libs/utils";
import { GetCommentsDetailResponse, StoryCommentItem } from "@api/comments/[id]";

export type CommentsMoreInfo = { reCommentRefId: number; page: number; isLoading: boolean } | null;

export interface GetStoriesCommentsResponse {
  success: boolean;
  total: number;
  moreInfo: CommentsMoreInfo;
  comments: StoryCommentItem[];
  historyComments: { moreInfo: CommentsMoreInfo; comments: StoryCommentItem[] }[];
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
      const { id: _id, reCommentRefId: _reCommentRefId, page: _page, moreHistory: _moreHistory } = req.query;
      const { user } = req.session;

      // request valid
      if (!_id) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (_reCommentRefId && !_page) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }
      if (_page && !_reCommentRefId) {
        const error = new Error("InvalidRequestBody");
        error.name = "InvalidRequestBody";
        throw error;
      }

      // find story detail
      const id = +_id.toString();
      const moreInfo = _reCommentRefId && _page ? { reCommentRefId: +_reCommentRefId?.toString(), page: +_page?.toString(), isLoading: true } : null;
      const moreHistory: CommentsMoreInfo[] = _moreHistory ? JSON.parse(_moreHistory.toString()) : [];
      const story = await client.story.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          comments: {
            where: {
              storyId: id,
              ...(moreInfo ? { id: moreInfo.reCommentRefId } : { depth: 0 }),
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
            },
          },
        },
      });
      if (!story) {
        const error = new Error("NotFoundStory");
        error.name = "NotFoundStory";
        throw error;
      }

      // comments count
      const total = await client.storyComment.count({
        where: {
          storyId: id,
          depth: {
            gte: StoryCommentMinimumDepth,
            lte: StoryCommentMaximumDepth,
          },
        },
      });

      const getReCommentResponse: (reCommentRefId: number, page: number) => Promise<Response> = async (reCommentRefId, page) => {
        const reCommentFilter = page === 1 ? "ALL" : "ONLY_CHILDREN";
        const reCommentTakeLength = page === 1 ? 2 : 3;
        const reCommentSkipLength = page === 1 ? 0 : 3 * (page - 2) + 2;
        const reCommentQuery = `reCommentFilter=${reCommentFilter}&reCommentTakeLength=${reCommentTakeLength}&reCommentSkipLength=${reCommentSkipLength}`;
        const reCommentResponse = await fetch(`${originUrl}/api/comments/${reCommentRefId}?${reCommentQuery}`);
        return reCommentResponse;
      };

      // comments data
      const comments = [];
      const { origin: originUrl } = getAbsoluteUrl(req);
      for (let index = 0; index < story.comments.length; index++) {
        const { reCommentRefId = story.comments[index].id, page = 1 } = moreInfo || {};
        const reCommentResponse: GetCommentsDetailResponse = await (await getReCommentResponse(reCommentRefId, page)).json();
        if (!reCommentResponse.success) {
          const error = new Error("ReCommentResponseError");
          error.name = "ReCommentResponseError";
          throw error;
        }
        comments.push(reCommentResponse.comment);
      }

      const historyComments = [];
      for (let index = 0; index < moreHistory.length; index++) {
        if (!moreHistory[index]) continue;
        const { reCommentRefId, page } = moreHistory[index]!;
        const reCommentResponse: GetCommentsDetailResponse = await (await getReCommentResponse(reCommentRefId, page)).json();
        if (!reCommentResponse.success) {
          const error = new Error("ReCommentResponseError");
          error.name = "ReCommentResponseError";
          throw error;
        }
        historyComments.push({
          moreInfo: moreHistory[index],
          comments: [reCommentResponse.comment],
        });
      }

      // result
      const result: GetStoriesCommentsResponse = {
        success: true,
        total,
        moreInfo: moreInfo ? { ...moreInfo, isLoading: false } : null,
        comments,
        historyComments,
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
