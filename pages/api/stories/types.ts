import { Feeling } from "@prisma/client";

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

export const StoryCategory: { text: keyof typeof StoryCategoryEnum; value: StoryCategoryEnum; feedback: string[] }[] = [
  { text: "동네질문", value: "question", feedback: ["curiosity"] },
  { text: "동네사건사고", value: "incident", feedback: ["emotion"] },
  { text: "동네소식", value: "report", feedback: ["emotion"] },
  { text: "동네맛집", value: "restaurant", feedback: ["emotion"] },
  { text: "취미생활", value: "dilettante-life", feedback: ["emotion"] },
  { text: "일상", value: "daily", feedback: ["curiosity"] },
  { text: "분실/실종센터", value: "missing/disappear", feedback: ["emotion"] },
  { text: "해주세요", value: "entrust", feedback: ["emotion"] },
  { text: "동네사진전", value: "photo-exhibit", feedback: ["emotion"] },
];

export type FeelingKeys = Feeling;
export const FeelingIcon: { [key in FeelingKeys]: string } = {
  Like: "👍",
  Love: "❤️",
  Haha: "😀",
  Wow: "😲",
  Sad: "😢",
  Angry: "😠",
};
