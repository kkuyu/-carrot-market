import { StoryCategory } from "@prisma/client";
// @api
import { CommentTypeEnum } from "@api/comments/types";

export const StoryPhotoOptions = {
  maxLength: 5,
  duplicateDelete: true,
  acceptTypes: ["image/jpeg", "image/png", "image/gif"],
};

export type StoryCategories = {
  value: StoryCategory;
  text: string;
  isLikeWithEmotion?: boolean;
  commentType?: CommentTypeEnum;
}[];

export const StoryCategories: StoryCategories = [
  { value: StoryCategory["POPULAR_STORY"], text: "인기소식" },
  { value: StoryCategory["QUESTION"], text: "동네질문", isLikeWithEmotion: false, commentType: CommentTypeEnum.answer },
  { value: StoryCategory["INCIDENT"], text: "동네사건사고", isLikeWithEmotion: true, commentType: CommentTypeEnum.comment },
  { value: StoryCategory["REPORT"], text: "동네소식", isLikeWithEmotion: true, commentType: CommentTypeEnum.comment },
  { value: StoryCategory["RESTAURANT"], text: "동네맛집", isLikeWithEmotion: true, commentType: CommentTypeEnum.comment },
  { value: StoryCategory["DILETTANTE_LIFE"], text: "취미생활", isLikeWithEmotion: true, commentType: CommentTypeEnum.comment },
  { value: StoryCategory["DAILY"], text: "일상", isLikeWithEmotion: false, commentType: CommentTypeEnum.answer },
  { value: StoryCategory["MISSING_AND_DISAPPEAR"], text: "분실/실종센터", isLikeWithEmotion: true, commentType: CommentTypeEnum.comment },
  { value: StoryCategory["ENTRUST"], text: "해주세요", isLikeWithEmotion: true, commentType: CommentTypeEnum.comment },
  { value: StoryCategory["PHOTO_EXHIBIT"], text: "동네사진전", isLikeWithEmotion: true, commentType: CommentTypeEnum.comment },
];
