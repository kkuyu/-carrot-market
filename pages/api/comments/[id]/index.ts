import { NextApiRequest, NextApiResponse } from "next";
import { Record, User, StoryComment, Story } from "@prisma/client";
// @libs
import { getCommentCondition, isInstance } from "@libs/utils";
import client from "@libs/server/client";
import withHandler, { ResponseDataType } from "@libs/server/withHandler";
import { withSessionRoute } from "@libs/server/withSession";
// @api
import { StoryCommentMinimumDepth, StoryCommentMaximumDepth, StoryCommentReadTypeEnum } from "@api/stories/types";

export interface StoryCommentCondition {
  role: {
    myRole: "author" | "reader" | "unknown";
  };
  likes: number;
  isLike?: boolean;
}

export type StoryCommentItem = StoryComment & {
  user?: Pick<User, "id" | "name" | "avatar">;
  story?: Partial<Story> & { user?: Pick<User, "id" | "name" | "avatar"> };
  records?: Pick<Record, "id" | "kind" | "userId">[];
  _count?: { reComments: number };
  reComments?: StoryCommentItem[];
};

export interface GetCommentsDetailResponse extends ResponseDataType {
  comment: StoryCommentItem;
  commentCondition?: StoryCommentCondition | null;
}

export const getCommentsDetail = async (query: { id: number; userId?: number }) => {
  const { id, userId } = query;

  const comment = await client.storyComment.findUnique({
    where: {
      id,
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
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      records: {
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      _count: {
        select: {
          reComments: true,
        },
      },
    },
  });

  const commentCondition = getCommentCondition(comment, userId || null);

  return { comment, commentCondition };
};

export const getCommentsReComments = async (query: {
  existed: number[];
  readType: StoryCommentReadTypeEnum | null;
  reCommentRefId: number;
  prevCursor: number;
  pageSize: number;
  commentDepth: number;
  storyId: number;
}) => {
  const { existed, readType, reCommentRefId, prevCursor, pageSize, commentDepth, storyId } = query;
  let comments = [] as StoryCommentItem[];

  const orderBy = {
    createdAt: "asc" as "asc" | "desc",
  };
  const include = {
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
        category: true,
      },
    },
    _count: {
      select: {
        reComments: true,
      },
    },
  };

  const defaultComments = await client.storyComment.findMany({
    where: {
      storyId,
      depth: commentDepth + 1,
    },
    orderBy,
    include: {
      ...include,
      reComments: {
        skip: 0,
        take: !existed.length ? 2 : 0,
        orderBy: {
          createdAt: "asc",
        },
        include,
      },
    },
  });
  comments = comments.concat(
    defaultComments.map(({ reComments, ...o }) => o),
    defaultComments.flatMap((o) => o.reComments)
  );

  // fetch comments: existed
  const existedComments = await client.storyComment.findMany({
    where: {
      storyId,
      OR: existed.filter((id) => !comments.find((o) => o.id === id)).map((id) => ({ id })),
    },
    orderBy,
    include,
  });
  comments = comments.concat(existedComments);

  // fetch comments: more
  const moreComments = readType
    ? await client.storyComment.findMany({
        skip: prevCursor ? 1 : 0,
        ...(readType === "more" && { take: pageSize }),
        ...(prevCursor && { cursor: { id: prevCursor } }),
        where: {
          storyId,
          reCommentRefId,
          AND: { depth: { gte: StoryCommentMinimumDepth, lte: StoryCommentMaximumDepth } },
        },
        orderBy,
        include,
      })
    : [];
  comments = comments.concat(moreComments);

  return { comments };
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseDataType>) {
  try {
    const { id: _id, includeReComments: _includeReComments, existed: _existed, readType: _readType, reCommentRefId: _reCommentRefId, prevCursor: _prevCursor } = req.query;
    const { user } = req.session;

    // invalid
    if (!_id) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }
    if (_readType && !isInstance(_readType.toString(), StoryCommentReadTypeEnum)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // params
    const id = +_id.toString();
    const includeReComments = _includeReComments ? JSON.parse(_includeReComments.toString()) : false;
    if (isNaN(id)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data
    const { comment, commentCondition } = await getCommentsDetail({ id });
    if (!comment || comment.depth < StoryCommentMinimumDepth || comment.depth > StoryCommentMaximumDepth) {
      const error = new Error("NotFoundComment");
      error.name = "NotFoundComment";
      throw error;
    }

    // early return result
    if (!includeReComments) {
      const result: GetCommentsDetailResponse = {
        success: true,
        comment,
        commentCondition,
      };
      return res.status(200).json(result);
    }

    // comment params
    const existed: number[] = _existed ? JSON.parse(_existed?.toString()) : [];
    const readType = _readType ? (_readType?.toString() as StoryCommentReadTypeEnum) : null;
    const reCommentRefId = _reCommentRefId ? +_reCommentRefId?.toString() : 0;
    const prevCursor = _prevCursor ? +_prevCursor?.toString() : 0;
    const pageSize = !readType || !reCommentRefId ? 0 : !prevCursor ? 2 : 10;
    if (isNaN(reCommentRefId) || isNaN(prevCursor)) {
      const error = new Error("InvalidRequestBody");
      error.name = "InvalidRequestBody";
      throw error;
    }

    // fetch data: comments
    const { comments } = await getCommentsReComments({ existed, readType, reCommentRefId, prevCursor, pageSize, commentDepth: comment.depth, storyId: comment.storyId });

    // result
    const result: GetCommentsDetailResponse = {
      success: true,
      comment: { ...comment, reComments: comments },
      commentCondition,
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
    methods: [{ type: "GET", isPrivate: false }],
    handler,
  })
);
