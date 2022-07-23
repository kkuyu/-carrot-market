import Link from "next/link";
import { Children, cloneElement, isValidElement } from "react";
import Product, { ProductItem, ProductProps } from "@components/cards/product";
import { FeedbackProductProps } from "@components/groups/feedbackProduct";

interface ProductWithFeedbackListProps {
  list: ProductItem[];
  children: React.ReactNode;
}

const ProductWithFeedbackList = ({ list, children }: ProductWithFeedbackListProps) => {
  return (
    <ul className="divide-y-8">
      {list.map((item) => {
        const childrenWithProps = Children.map(children, (child, index) => {
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

export default ProductWithFeedbackList;
