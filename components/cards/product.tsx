import Image from "next/image";
import { useRef, useEffect } from "react";
// @libs
import { getDiffTimeStr } from "@libs/utils";
// @api
import { GetProductsResponse } from "@api/products";
import { GetProfilesProductsResponse } from "@api/users/profiles/products";

export type ProductItem = GetProductsResponse["products"][0] | GetProfilesProductsResponse["products"][0];

interface ProductProps {
  item: ProductItem;
  size?: "tiny" | "base";
}

const Product = ({ item, size = "base" }: ProductProps) => {
  const diffTime = useRef("");
  const thumbnailId = item?.photos ? item.photos.split(",")[0] : "";

  const isSale = item?.records && Boolean(item?.records?.find((record) => record.kind === "Sale"));
  const isSold = item?.records && !isSale;
  const favorites = item?.records?.filter((record) => record.kind === "Favorite");

  useEffect(() => {
    const today = new Date();
    diffTime.current = getDiffTimeStr(new Date(item?.resumeAt).getTime(), today.getTime());
  }, []);

  if (size === "tiny") {
    return (
      <div className="flex items-start">
        <div className="relative flex-none w-14 border border-gray-200 bg-slate-300 overflow-hidden rounded-md">
          <div className="pb-[100%]" />
          {thumbnailId ? (
            <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${thumbnailId}/public`} alt="" layout="fill" objectFit="cover" />
          ) : (
            <svg
              className="absolute top-1/2 left-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              ></path>
            </svg>
          )}
        </div>
        <div className="grow pl-3">
          <strong className="block text-sm font-normal">{item.name}</strong>
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
        <div className="relative flex-none w-24 border border-gray-200 bg-slate-300 overflow-hidden rounded-md">
          <div className="pb-[100%]" />
          {thumbnailId ? (
            <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${thumbnailId}/public`} alt="" layout="fill" objectFit="cover" />
          ) : (
            <svg
              className="absolute top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              ></path>
            </svg>
          )}
        </div>
        <div className="grow pl-4">
          <strong className="block font-normal">{item?.name}</strong>
          <span className="block text-sm text-gray-500">{[item?.emdPosNm, diffTime.current, !item?.resumeCount ? null : `끌올 ${item.resumeCount}회`].filter((v) => !!v).join(" · ")}</span>
          <div className="block mt-2 pr-8">
            {isSold && <em className="inline-block mr-2 px-1.5 py-1 text-xs font-semibold not-italic text-white bg-black rounded-md">판매완료</em>}
            <span className="font-semibold align-middle">₩{item?.price}</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0">
        {Boolean(favorites?.length) && (
          <div className="flex items-center space-x-0.5 text-sm text-gray-400">
            <svg className="flex-none w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              ></path>
            </svg>
            <span>{favorites.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;
