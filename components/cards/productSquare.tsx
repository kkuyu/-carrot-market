import type { HTMLAttributes } from "react";
// @api
import { GetProductsDetailRecommendsResponse } from "@api/products/[id]/recommends";
// @components
import Images from "@components/images";

export type ProductSquareItem = GetProductsDetailRecommendsResponse["products"][number];

export interface ProductSquareProps extends HTMLAttributes<HTMLDivElement> {
  item: ProductSquareItem;
}

const ProductSquare = (props: ProductSquareProps) => {
  const { item, className = "", ...restProps } = props;

  if (!item) return null;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <div className="">
        <Images size="100%" ratioX={16} ratioY={9} cloudId={item?.photos?.replace(/;.*/, "")} cloudVariant="public" alt="" className="rounded-md" />
      </div>
      <div className="mt-2">
        <strong className="block font-normal">{item?.name}</strong>
        <span className="block text-sm font-semibold">₩{item?.price}</span>
      </div>
    </div>
  );
};

export default ProductSquare;
