import { useEffect } from "react";
import type { NextPage } from "next";
import { Product, Record } from "@prisma/client";
import useSWRInfinite from "swr/infinite";

import usePagination from "@libs/client/usePagination";

import Layout from "@components/layout";
import Item from "@components/item";
import FloatingButton from "@components/floating-button";

interface ProductResponse {
  success: boolean;
  products: (Product & { records: Pick<Record, "id">[] })[];
  pages: number;
}

const Home: NextPage = () => {
  const { page } = usePagination({ isInfiniteScroll: true });

  const getKey = (pageIndex: number, previousPageData: ProductResponse) => {
    if (pageIndex === 0) return `/api/products?page=1`;
    if (previousPageData && !previousPageData.products.length) return null;
    if (pageIndex + 1 > previousPageData.pages) return null;
    return `/api/products?page=${pageIndex + 1}`;
  };

  const { data, setSize } = useSWRInfinite<ProductResponse>(getKey, (url: string) => fetch(url).then((response) => response.json()), {
    initialSize: 1,
    revalidateFirstPage: false,
  });
  const products = data ? data.flatMap((item) => item.products) : [];

  useEffect(() => {
    setSize(page);
  }, [setSize, page]);

  return (
    <Layout hasTabBar seoTitle="Home" title="Home">
      <div className="container">
        <div className="-mx-4 flex flex-col divide-y">
          {products.map((product) => (
            <Item key={product.id} href={`/products/${product.id}`} title={product.name} price={product.price} hearts={product.records.length} />
          ))}
          <FloatingButton href="/products/upload">
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </FloatingButton>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
