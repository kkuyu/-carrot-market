import Link from "next/link";
import { Children, cloneElement, isValidElement } from "react";
// @components
import Product, { ProductItem } from "@components/cards/product";
import { FeedbackProductProps } from "@components/groups/feedbackProduct";

interface ProductListProps {
  list: ProductItem[];
  children?: React.ReactNode;
}

const ProductList = ({ list, children = [] }: ProductListProps) => {
  if (!Boolean(list.length)) {
    return null;
  }

  return (
    <ul className="divide-y">
      {list.map((item) => {
        const childrenWithProps = Children.map(children, (child) => {
          if (isValidElement(child)) {
            if (child.key === "FeedbackProduct") return cloneElement(child as React.ReactElement<FeedbackProductProps>, { item });
          }
          return child;
        });
        return (
          <li key={item?.id} className="relative">
            <div>
              <Link href={`/products/${item?.id}`}>
                <a className="block p-5">
                  <Product item={item} />
                </a>
              </Link>
            </div>
            {childrenWithProps}
          </li>
        );
      })}
    </ul>
  );
};

export default ProductList;
