import Link from "next/link";
import type { HTMLAttributes, ReactElement } from "react";
import { Children, cloneElement, isValidElement } from "react";
// @components
import Product, { ProductItem } from "@components/cards/product";
import { FeedbackProductProps } from "@components/groups/feedbackProduct";
import { LikeProductProps } from "@components/groups/likeProduct";
import { HandleProductProps } from "@components/groups/handleProduct";

interface ProductListProps extends HTMLAttributes<HTMLUListElement> {
  list: ProductItem[];
  highlight?: string[];
  children?: ReactElement | ReactElement[];
}

const ProductList = (props: ProductListProps) => {
  const { list, children = [], highlight = [], className = "", ...restProps } = props;

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`divide-y bg-red ${className}`} {...restProps}>
      {list.map((item) => {
        let includeLikeProduct = false;
        const childrenWithProps = Children.map(children, (child) => {
          if (isValidElement(child)) {
            if (child.key === "LikeProduct") includeLikeProduct = true;
            if (child.key === "LikeProduct") return cloneElement(child as ReactElement<LikeProductProps>, { item });
            if (child.key === "FeedbackProduct") return cloneElement(child as ReactElement<FeedbackProductProps>, { item });
            if (child.key === "HandleProduct") return cloneElement(child as ReactElement<HandleProductProps>, { item });
          }
          return child;
        });
        return (
          <li key={item?.id} className="relative">
            <Link href={`/products/${item?.id}`}>
              <a className="block px-5 py-3">
                <Product item={item} className={includeLikeProduct ? "pr-8" : ""} highlight={highlight} />
              </a>
            </Link>
            {childrenWithProps}
          </li>
        );
      })}
    </ul>
  );
};

export default ProductList;
