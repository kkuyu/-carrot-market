import { Chat, Manner, Product, Record, Review, Story, StoryComment, User } from "@prisma/client";
// @libs
import { ResponseDataType } from "@libs/server/withHandler";
// @api
import { ProfileProductsEnum } from "@api/profiles/[id]/products/[filter]";
import { ProfileStoriesEnum } from "@api/profiles/[id]/stories/[filter]";
import { ProfileCommentsEnum } from "@api/profiles/[id]/comments/[filter]";
import { ProfileReviewsEnum } from "@api/profiles/[id]/reviews/[filter]";
import { ProfileMannersEnum } from "@api/profiles/[id]/manners/[filter]";

export interface GetProfilesModelsResponse extends ResponseDataType {
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
  [ProfileModelsEnum.products]: ProfileProductsEnum,
  [ProfileModelsEnum.stories]: ProfileStoriesEnum,
  [ProfileModelsEnum.comments]: ProfileCommentsEnum,
  [ProfileModelsEnum.reviews]: ProfileReviewsEnum,
  [ProfileModelsEnum.manners]: ProfileMannersEnum,
} as const;

export type ProfileModelsEnums = {
  [K in ProfileModelsEnum]: keyof typeof ProfileModelsEnums[K];
};

export type ProfileModelsContent = {
  [K in ProfileModelsEnum]?: GetProfilesModelsResponse[K];
};
