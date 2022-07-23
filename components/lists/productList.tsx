import Link from "next/link";
// @components
import Product, { ProductItem, ProductProps } from "@components/cards/product";

interface ProductListProps {
  list: ProductItem[];
}

const ProductList = ({ list }: ProductListProps) => {
  return (
    <ul className="divide-y">
      {list.map((item) => (
        <li key={item?.id}>
          <Link href={`/products/${item?.id}`}>
            <a className="block p-5">
              <Product item={item} />
            </a>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default ProductList;
