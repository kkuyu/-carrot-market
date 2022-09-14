import { ConcernValue } from "@prisma/client";
// @api
import { ProfileProductsFilterEnum } from "@api/profiles/[id]/products/[filter]";
import { ProfileStoriesFilterEnum } from "@api/profiles/[id]/stories/[filter]";
import { ProfileCommentsFilterEnum } from "@api/profiles/[id]/comments/[filter]";
import { ProfileReviewsFilterEnum } from "@api/profiles/[id]/reviews/[filter]";
import { ProfileMannersFilterEnum } from "@api/profiles/[id]/manners/[filter]";

export const ProfilePhotoOptions = {
  maxLength: 5,
  duplicateDelete: true,
  acceptTypes: ["image/jpeg", "image/png", "image/gif"],
};

export type ProfileConcerns = {
  value: ConcernValue;
  text: string;
  emoji: string;
}[];

export const ProfileConcerns = [
  { value: ConcernValue.SPORTS, text: "운동", emoji: "👟" },
  { value: ConcernValue.STUDY, text: "스터디", emoji: "📚" },
  { value: ConcernValue.FAMILY_AND_PARENTING, text: "가족/육아", emoji: "🍼" },
  { value: ConcernValue.FRIEND, text: "동네친구", emoji: "🌟" },
  { value: ConcernValue.CRAFT, text: "공예/만들기", emoji: "🧶" },
  { value: ConcernValue.COMPANION_ANIMAL, text: "반려동물", emoji: "🐾" },
  { value: ConcernValue.GAME, text: "게임", emoji: "🎮" },
  { value: ConcernValue.MUSIC, text: "음악", emoji: "🎹" },
  { value: ConcernValue.MOVIE, text: "영화", emoji: "🎥" },
  { value: ConcernValue.FOOD, text: "음식", emoji: "🍽️" },
  { value: ConcernValue.CULTURE_AND_ART, text: "문화/예술", emoji: "🖼️" },
  { value: ConcernValue.TRAVEL, text: "여행", emoji: "✈️" },
  { value: ConcernValue.PICTURE_AND_VIDEO, text: "사진/영상", emoji: "📷" },
  { value: ConcernValue.READING, text: "독서", emoji: "📙" },
  { value: ConcernValue.FASHION, text: "패션", emoji: "👓" },
  { value: ConcernValue.TECH, text: "테크", emoji: "💻" },
  { value: ConcernValue.CAR_AND_MOTORCYCLE, text: "차/오토바이", emoji: "🚙" },
  { value: ConcernValue.INVESTMENT_AND_FINANCE, text: "투자/금융", emoji: "📈" },
  { value: ConcernValue.VOLUNTEERING, text: "봉사활동", emoji: "🙌" },
  { value: ConcernValue.BEAUTY_AND_COSMETOLOGY, text: "뷰티/미용", emoji: "🧼" },
  { value: ConcernValue.PLANT, text: "식물", emoji: "🌱" },
  { value: ConcernValue.INTERIOR, text: "인테리어", emoji: "🛏️" },
];
