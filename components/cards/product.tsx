import type { HTMLAttributes } from "react";
// @libs
import { getProductCondition } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useTimeDiff from "@libs/client/useTimeDiff";
// @api
import { ProductCondition } from "@api/products/[id]";
import { GetProductsResponse } from "@api/products";
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products/[filter]";
import { GetSearchResultResponse } from "@api/search/result/[filter]";
// @components
import Images from "@components/images";
import HighlightText from "@components/highlightText";
import Icons from "@components/icons";

export type ProductItem = GetProductsResponse["products"][number] | GetProfilesProductsResponse["products"][number] | GetSearchResultResponse["products"][number];

export interface ProductProps extends HTMLAttributes<HTMLDivElement> {
  item: ProductItem;
  condition?: ProductCondition;
  highlightWord?: string;
}

const Product = (props: ProductProps) => {
  const { item, condition, highlightWord, className = "", ...restProps } = props;
  const { user } = useUser();

  // visible data: default
  const { isMounted, timeState } = useTimeDiff(item ? item?.resumeAt.toString() : null);
  const thumbnailId = item?.photos ? item.photos.split(";")[0] : "";
  const productCondition = condition ?? getProductCondition(item, user?.id);

  if (!item) return null;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <div className="flex items-start">
        <div className="flex-none">
          <Images size="6rem" cloudId={thumbnailId} cloudVariant="public" alt="" className="rounded-md" />
        </div>
        <div className="grow-full pl-4">
          <strong className="block font-normal">{highlightWord ? <HighlightText originalText={item?.name || ""} highlightWord={highlightWord} /> : item?.name}</strong>
          <div className="text-description text-sm">
            {item?.emdPosNm && <span>{item?.emdPosNm}</span>}
            {isMounted && timeState.diffStr && <span>{timeState.diffStr}</span>}
            {!!item?.resumeCount && <span>끌올 {item.resumeCount}회</span>}
          </div>
          <div className="mt-2 pr-16">
            {productCondition && !productCondition?.isSale && <em className="inline-block mr-2 px-1.5 py-1 text-xs font-semibold not-italic text-white bg-black rounded-md">판매완료</em>}
            <span className="font-semibold align-middle">₩{item?.price}</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 flex items-center space-x-0.5 text-sm text-gray-400">
        {productCondition && Boolean(productCondition?.likes) && (
          <>
            <Icons name="Heart" className="flex-none w-5 h-5 pl-1" />
            <span>{productCondition.likes}</span>
          </>
        )}
        {productCondition && Boolean(productCondition?.chats) && (
          <>
            <Icons name="ChatBubbleLeftRight" className="flex-none w-5 h-5 pl-1" />
            <span>{productCondition.chats}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default Product;
