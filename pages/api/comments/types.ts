import { Emotion } from "@prisma/client";

export const CommentMinimumDepth = 0;
export const CommentMaximumDepth = 1;

export const CommentTypeEnum = {
  ["comment"]: "댓글",
  ["answer"]: "답변",
  ["reply"]: "답글",
} as const;

export type CommentTypeEnum = typeof CommentTypeEnum[keyof typeof CommentTypeEnum];

export const CommentReadEnum = {
  ["more"]: "more",
  ["fold"]: "fold",
} as const;

export type CommentReadEnum = typeof CommentReadEnum[keyof typeof CommentReadEnum];

export type CommentEmotionIcon = {
  [key in Emotion]: { emoji: string };
};
export const CommentEmotionIcon: CommentEmotionIcon = {
  Like: { emoji: "👍" },
  Love: { emoji: "❤️" },
  Haha: { emoji: "😀" },
  Wow: { emoji: "😲" },
  Sad: { emoji: "😢" },
  Angry: { emoji: "😠" },
};
