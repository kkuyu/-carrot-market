import { Emotion } from "@prisma/client";

export const StoryCommentMinimumDepth = 0;
export const StoryCommentMaximumDepth = 3;

export const StoryCategoryEnum = {
  ["동네질문"]: "question",
  ["동네사건사고"]: "incident",
  ["동네소식"]: "report",
  ["동네맛집"]: "restaurant",
  ["취미생활"]: "dilettante-life",
  ["일상"]: "daily",
  ["분실/실종센터"]: "missing/disappear",
  ["해주세요"]: "entrust",
  ["동네사진전"]: "photo-exhibit",
} as const;

export type StoryCategoryEnum = typeof StoryCategoryEnum[keyof typeof StoryCategoryEnum];

export const StoryCategory: { text: keyof typeof StoryCategoryEnum; value: StoryCategoryEnum; isLikeWithEmotion: boolean; commentType: "댓글" | "답변" }[] = [
  { text: "동네질문", value: "question", isLikeWithEmotion: false, commentType: "답변" },
  { text: "동네사건사고", value: "incident", isLikeWithEmotion: true, commentType: "댓글" },
  { text: "동네소식", value: "report", isLikeWithEmotion: true, commentType: "댓글" },
  { text: "동네맛집", value: "restaurant", isLikeWithEmotion: true, commentType: "댓글" },
  { text: "취미생활", value: "dilettante-life", isLikeWithEmotion: true, commentType: "댓글" },
  { text: "일상", value: "daily", isLikeWithEmotion: false, commentType: "답변" },
  { text: "분실/실종센터", value: "missing/disappear", isLikeWithEmotion: true, commentType: "댓글" },
  { text: "해주세요", value: "entrust", isLikeWithEmotion: true, commentType: "댓글" },
  { text: "동네사진전", value: "photo-exhibit", isLikeWithEmotion: true, commentType: "댓글" },
];

export type EmotionKeys = Emotion;
export const EmotionIcon: { [key in EmotionKeys]: string } = {
  Like: "👍",
  Love: "❤️",
  Haha: "😀",
  Wow: "😲",
  Sad: "😢",
  Angry: "😠",
};
