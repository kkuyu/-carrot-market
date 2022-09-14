import { Chat, Manner, Product, Record, Review, Story, StoryComment, User } from "@prisma/client";
// @libs
import { ResponseDataType } from "@libs/server/withHandler";
import { ProfileProductsFilterEnum } from "@api/profiles/[id]/products/[filter]";
import { ProfileStoriesFilterEnum } from "@api/profiles/[id]/stories/[filter]";
import { ProfileCommentsFilterEnum } from "@api/profiles/[id]/comments/[filter]";
import { ProfileReviewsFilterEnum } from "@api/profiles/[id]/reviews/[filter]";
import { ProfileMannersFilterEnum } from "@api/profiles/[id]/manners/[filter]";

export interface GetProfilesDetailModelsResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  products: (Product & {
    user?: Pick<User, "id" | "name" | "photos">;
    records?: Pick<Record, "id" | "kind" | "userId">[];
    chats?: (Chat & { _count: { chatMessages: number } })[];
    reviews?: Pick<Review, "id" | "role" | "sellUserId" | "purchaseUserId">[];
  })[];
  stories: (Story & {
    user?: Pick<User, "id" | "name" | "photos">;
    records?: Pick<Record, "id" | "kind" | "emotion" | "userId">[];
    comments?: (Pick<StoryComment, "id"> & Pick<Partial<StoryComment>, "userId" | "content">)[];
  })[];
  comments: (StoryComment & {
    user?: Pick<User, "id" | "name" | "photos">;
    story?: Pick<Story, "id" | "content" | "createdAt">;
    records?: Pick<Record, "id" | "kind" | "userId">[];
  })[];
  reviews: (Review & { purchaseUser?: Pick<User, "id" | "name" | "photos">; sellUser?: Pick<User, "id" | "name" | "photos"> })[];
  manners: (Manner & { isRude: boolean; _count: { reviews: number } })[];
}

export const ProfileModelsEnum = {
  ["products"]: "products",
  ["stories"]: "stories",
  ["comments"]: "comments",
  ["reviews"]: "reviews",
  ["manners"]: "manners",
} as const;

export type ProfileModelsEnum = typeof ProfileModelsEnum[keyof typeof ProfileModelsEnum];

export const ProfileModelsEnums = {
  [ProfileModelsEnum.products]: ProfileProductsFilterEnum,
  [ProfileModelsEnum.stories]: ProfileStoriesFilterEnum,
  [ProfileModelsEnum.comments]: ProfileCommentsFilterEnum,
  [ProfileModelsEnum.reviews]: ProfileReviewsFilterEnum,
  [ProfileModelsEnum.manners]: ProfileMannersFilterEnum,
} as const;

export type ProfileModelsEnums = {
  [K in ProfileModelsEnum]: keyof typeof ProfileModelsEnums[K];
};

export type ProfilesDetailContents = {
  [K in ProfileModelsEnum]?: GetProfilesDetailModelsResponse[K];
};
