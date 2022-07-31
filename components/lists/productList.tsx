import Link from "next/link";
import { Children, cloneElement, isValidElement } from "react";
// @components
import Product, { ProductItem } from "@components/cards/product";
import { FeedbackProductProps } from "@components/groups/feedbackProduct";

interface ProductListProps {
  list: ProductItem[];
  children?: React.ReactNode;
}

const ProductList = ({ list, children }: ProductListProps) => {
  return (
    <ul className="divide-y">
      {list.map((item) => {
        const childrenWithProps = !children
          ? null
          : Children.map(children, (child, index) => {
              if (isValidElement(child)) {
                return cloneElement(child as React.ReactElement<FeedbackProductProps>, { item });
              }
              return child;
            });
        return (
          <li key={item?.id} className="relative">
            <Link href={`/products/${item?.id}`}>
              <a className="block p-5">
                <Product item={item} />
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
