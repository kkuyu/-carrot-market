import { Chat, Product, Record, Review } from "@prisma/client";
// @libs
import { ResponseDataType } from "@libs/server/withHandler";
// @api
import { UserProductsEnum } from "@api/user/products/[filter]";

export interface GetUserModelsResponse extends ResponseDataType {
  totalCount: number;
  lastCursor: number;
  products: (Product & {
    records?: Pick<Record, "id" | "kind" | "userId">[];
    reviews?: Pick<Review, "id" | "role" | "sellUserId" | "purchaseUserId">[];
    chats?: (Chat & { _count: { chatMessages: number } })[];
  })[];
}

export const UserModelsEnum = {
  ["products"]: "products",
} as const;

export type UserModelsEnum = typeof UserModelsEnum[keyof typeof UserModelsEnum];

export const UserModelsEnums = {
  [UserModelsEnum.products]: UserProductsEnum,
} as const;

export type UserModelsEnums = {
  [K in UserModelsEnum]: keyof typeof UserModelsEnums[K];
};

export type UserModelsContent = {
  [K in UserModelsEnum]?: GetUserModelsResponse[K];
};
