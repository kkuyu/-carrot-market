import type { HTMLAttributes } from "react";
import { Kind } from "@prisma/client";
// @api
import { GetProductsResponse } from "@api/products";
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products/[filter]";
// @components
import Images from "@components/images";

export type ProductSummaryItem = GetProductsResponse["products"][number] | GetProfilesProductsResponse["products"][number];

export interface ProductSummaryProps extends HTMLAttributes<HTMLDivElement> {
  item: ProductSummaryItem;
}

const ProductSummary = (props: ProductSummaryProps) => {
  const { item, className = "", ...restProps } = props;

  const thumbnailId = item?.photos ? item.photos.split(";")[0] : "";
  const saleRecord = item?.records?.find((record) => record.kind === Kind.ProductSale);

  if (!item) return null;

  return (
    <div className={`flex items-start ${className}`} {...restProps}>
      <div className="flex-none">
        <Images size="2.75rem" cloudId={thumbnailId} cloudVariant="public" alt="" className="rounded-md" />
      </div>
      <div className="grow-full pl-3">
        <strong className="block text-sm font-normal text-ellipsis">
          {!saleRecord && <span className="text-gray-500">판매완료 </span>}
          {item.name}
        </strong>
        <span className="text-sm font-semibold">₩{item.price}</span>
      </div>
    </div>
  );
};

export default ProductSummary;
