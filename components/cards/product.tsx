import { useEffect, useState } from "react";
import { Kind } from "@prisma/client";
// @libs
import { getDiffTimeStr } from "@libs/utils";
// @api
import { GetProductsResponse } from "@api/products";
import { GetProfilesProductsResponse } from "@api/users/profiles/[id]/products";
// @components
import Images from "@components/images";

export type ProductItem = GetProductsResponse["products"][0] | GetProfilesProductsResponse["products"][0];

export interface ProductProps {
  item: ProductItem;
  size?: "tiny" | "base";
}

const Product = ({ item, size = "base" }: ProductProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item) return null;

  const today = new Date();
  const diffTime = getDiffTimeStr(new Date(item?.resumeAt).getTime(), today.getTime());
  const thumbnailId = item?.photos ? item.photos.split(",")[0] : "";

  const saleRecord = item?.records?.find((record) => record.kind === Kind.Sale);
  const favoriteRecords = item?.records?.filter((record) => record.kind === Kind.Favorite) || [];
  const foundChats = item?.chats?.filter((chat) => chat._count.chatMessages > 0);

  if (size === "tiny") {
    return (
      <div className="flex items-start">
        <div className="flex-none">
          <Images size="2.75rem" cloudId={thumbnailId} cloudVariant="public" rounded="md" alt="" />
        </div>
        <div className="grow shrink basis-auto min-w-0 pl-3">
          <strong className="block text-sm font-normal overflow-hidden whitespace-nowrap overflow-ellipsis">
            {!saleRecord && <span className="text-gray-500">판매완료 </span>}
            {item.name}
          </strong>
          <div className="block">
            <span className="text-sm font-semibold">₩{item.price}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-start">
        <div className="flex-none">
          <Images size="6rem" cloudId={thumbnailId} cloudVariant="public" rounded="md" alt="" />
        </div>
        <div className="grow pl-4">
          <strong className="block font-normal">{item?.name}</strong>
          <span className="block text-sm text-gray-500">{[item?.emdPosNm, mounted ? diffTime : null, !item?.resumeCount ? null : `끌올 ${item.resumeCount}회`].filter((v) => !!v).join(" · ")}</span>
          <div className="block mt-2 pr-16">
            {!saleRecord && <em className="inline-block mr-2 px-1.5 py-1 text-xs font-semibold not-italic text-white bg-black rounded-md">판매완료</em>}
            <span className="font-semibold align-middle">₩{item?.price}</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 flex items-center space-x-0.5 text-sm text-gray-400">
        {Boolean(favoriteRecords?.length) && (
          <>
            <svg className="flex-none w-4 h-4 pl-1 box-content" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              ></path>
            </svg>
            <span>{favoriteRecords.length}</span>
          </>
        )}
        {Boolean(foundChats?.length) && (
          <>
            <svg className="flex-none w-4 h-4 pl-1 box-content" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{foundChats?.length}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default Product;
