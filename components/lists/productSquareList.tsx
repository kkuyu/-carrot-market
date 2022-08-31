import Link from "next/link";
import type { HTMLAttributes, ReactElement } from "react";
// @components
import ProductSquare, { ProductSquareItem, ProductSquareProps } from "@components/cards/productSquare";

interface ProductSquareListProps extends HTMLAttributes<HTMLUListElement> {
  list: ProductSquareItem[];
  cardProps?: Partial<ProductSquareProps>;
  children?: ReactElement | ReactElement[];
}

const ProductSquareList = (props: ProductSquareListProps) => {
  const { list, children = [], cardProps = {}, className = "", ...restProps } = props;

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`grid grid-cols-2 gap-4 ${className}`} {...restProps}>
      {list.map((item) => {
        return (
          <li key={item?.id} className="">
            <Link href={`/products/${item?.id}`}>
              <a className="block">
                <ProductSquare item={item} {...cardProps} />
              </a>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default ProductSquareList;
