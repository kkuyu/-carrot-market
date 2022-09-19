import { Chat, Product, Record, Story, StoryComment, User } from "@prisma/client";
// @libs
import { ResponseDataType } from "@libs/server/withHandler";
// @api
import { SearchPreviewsEnum } from "@api/search/result/previews/[filter]";
import { SearchProductsEnum } from "@api/search/result/products/[filter]";
import { SearchStoriesEnum } from "@api/search/result/stories/[filter]";

export interface GetSearchModelsResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  previews: {
    counts?: { products: number; stories: number };
  };
  products: (Product & {
    user?: Pick<User, "id" | "name" | "photos">;
    records?: Pick<Record, "id" | "kind" | "userId">[];
    chats?: (Chat & { _count: { chatMessages: number } })[];
  })[];
  stories: (Story & {
    user?: Pick<User, "id" | "name" | "photos">;
    records?: Pick<Record, "id" | "kind" | "emotion" | "userId">[];
    comments?: (Pick<StoryComment, "id"> & Partial<Pick<StoryComment, "userId" | "content">>)[];
  })[];
}

export const SearchModelsEnum = {
  ["previews"]: "previews",
  ["products"]: "products",
  ["stories"]: "stories",
} as const;

export type SearchModelsEnum = typeof SearchModelsEnum[keyof typeof SearchModelsEnum];

export const SearchModelsEnums = {
  [SearchModelsEnum.previews]: SearchPreviewsEnum,
  [SearchModelsEnum.products]: SearchProductsEnum,
  [SearchModelsEnum.stories]: SearchStoriesEnum,
} as const;

export type SearchModelsEnums = {
  [K in SearchModelsEnum]: keyof typeof SearchModelsEnums[K];
};

export type SearchModelsContent = {
  [K in SearchModelsEnum]?: GetSearchModelsResponse[K];
};
