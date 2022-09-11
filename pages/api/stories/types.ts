import { StoryCategory, Emotion } from "@prisma/client";

export const StoryCommentReadTypeEnum = {
  ["more"]: "more",
  ["fold"]: "fold",
} as const;

export type StoryCommentReadTypeEnum = typeof StoryCommentReadTypeEnum[keyof typeof StoryCommentReadTypeEnum];

export const StoryCommentMinimumDepth = 0;
export const StoryCommentMaximumDepth = 1;

export const StoryPhotoOptions = {
  maxLength: 5,
  duplicateDelete: true,
  acceptTypes: ["image/jpeg", "image/png", "image/gif"],
};

export type StoryCategories = {
  value: StoryCategory;
  text: string;
  isLikeWithEmotion?: boolean;
  commentType?: "댓글" | "답변";
}[];

export const StoryCategories: StoryCategories = [
  { value: StoryCategory["POPULAR_STORY"], text: "인기소식" },
  { value: StoryCategory["QUESTION"], text: "동네질문", isLikeWithEmotion: false, commentType: "답변" as StoryCategories[number]["commentType"] },
  { value: StoryCategory["INCIDENT"], text: "동네사건사고", isLikeWithEmotion: true, commentType: "댓글" as StoryCategories[number]["commentType"] },
  { value: StoryCategory["REPORT"], text: "동네소식", isLikeWithEmotion: true, commentType: "댓글" as StoryCategories[number]["commentType"] },
  { value: StoryCategory["RESTAURANT"], text: "동네맛집", isLikeWithEmotion: true, commentType: "댓글" as StoryCategories[number]["commentType"] },
  { value: StoryCategory["DILETTANTE_LIFE"], text: "취미생활", isLikeWithEmotion: true, commentType: "댓글" as StoryCategories[number]["commentType"] },
  { value: StoryCategory["DAILY"], text: "일상", isLikeWithEmotion: false, commentType: "답변" as StoryCategories[number]["commentType"] },
  { value: StoryCategory["MISSING_AND_DISAPPEAR"], text: "분실/실종센터", isLikeWithEmotion: true, commentType: "댓글" as StoryCategories[number]["commentType"] },
  { value: StoryCategory["ENTRUST"], text: "해주세요", isLikeWithEmotion: true, commentType: "댓글" as StoryCategories[number]["commentType"] },
  { value: StoryCategory["PHOTO_EXHIBIT"], text: "동네사진전", isLikeWithEmotion: true, commentType: "댓글" as StoryCategories[number]["commentType"] },
];

export type EmotionKeys = Emotion;
export const EmotionIcon: { [key in EmotionKeys]: { emoji: string; index: number } } = {
  Like: { emoji: "👍", index: 0 },
  Love: { emoji: "❤️", index: 1 },
  Haha: { emoji: "😀", index: 2 },
  Wow: { emoji: "😲", index: 3 },
  Sad: { emoji: "😢", index: 4 },
  Angry: { emoji: "😠", index: 5 },
};
