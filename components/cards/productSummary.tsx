import type { HTMLAttributes } from "react";
// @libs
import { getProductCondition } from "@libs/utils";
import useUser from "@libs/client/useUser";
// @api
import { GetProductsResponse } from "@api/products";
import { GetProductsDetailResponse, ProductCondition } from "@api/products/[id]";
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products/[filter]";
// @components
import Images from "@components/images";

export type ProductSummaryItem = GetProductsResponse["products"][number] | GetProfilesProductsResponse["products"][number] | GetProductsDetailResponse["product"];

export interface ProductSummaryProps extends HTMLAttributes<HTMLDivElement> {
  item: ProductSummaryItem;
  condition?: ProductCondition;
}

const ProductSummary = (props: ProductSummaryProps) => {
  const { item, condition, className = "", ...restProps } = props;
  const { user } = useUser();

  // variable: visible
  const productCondition = condition ?? getProductCondition(item, user?.id);

  if (!item) return null;

  return (
    <div className={`flex items-start ${className}`} {...restProps}>
      <div className="flex-none">
        <Images size="2.75rem" cloudId={item?.photos?.replace(/;.*/, "")} alt="" className="rounded-md" />
      </div>
      <div className="grow-full pl-3">
        <strong className="block text-sm font-normal text-ellipsis">
          {productCondition && !productCondition.isSale && <span className="text-gray-500">판매완료 </span>}
          {item.name}
        </strong>
        <span className="text-sm font-semibold">₩{item.price}</span>
      </div>
    </div>
  );
};

export default ProductSummary;
