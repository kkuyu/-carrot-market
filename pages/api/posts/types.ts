import { Feeling } from "@prisma/client";

export const PostCategoryEnum = {
  ["동네질문"]: "question",
  ["동네사건사고"]: "accident",
  ["동네소식"]: "news",
  ["동네맛집"]: "famousRestaurant",
  ["취미생활"]: "leisureTime",
  ["일상"]: "dailyLife",
  ["분실/실종센터"]: "lost/missing",
  ["해주세요"]: "please",
  ["동네사진전"]: "photoExhibition",
} as const;

export type PostCategoryEnum = typeof PostCategoryEnum[keyof typeof PostCategoryEnum];

export const PostCategory: { text: keyof typeof PostCategoryEnum; value: PostCategoryEnum; feedback: string[] }[] = [
  { text: "동네질문", value: "question", feedback: ["curiosity"] },
  { text: "동네사건사고", value: "accident", feedback: ["emotion"] },
  { text: "동네소식", value: "news", feedback: ["emotion"] },
  { text: "동네맛집", value: "famousRestaurant", feedback: ["emotion"] },
  { text: "취미생활", value: "leisureTime", feedback: ["emotion"] },
  { text: "일상", value: "dailyLife", feedback: ["curiosity"] },
  { text: "분실/실종센터", value: "lost/missing", feedback: ["emotion"] },
  { text: "해주세요", value: "please", feedback: ["emotion"] },
  { text: "동네사진전", value: "photoExhibition", feedback: ["emotion"] },
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
