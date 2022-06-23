import { useEffect, useRef } from "react";
import type { GetServerSideProps, NextPage } from "next";

import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";

import client from "@libs/server/client";
import useOnScreen from "@libs/client/useOnScreen";
import { GetProductsResponse } from "@api/products";

import Layout from "@components/layout";
import Item from "@components/item";
import FloatingButton from "@components/floating-button";

const getKey = (pageIndex: number, previousPageData: GetProductsResponse) => {
  if (pageIndex === 0) return `/api/products?page=1`;
  if (previousPageData && !previousPageData.products.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/products?page=${pageIndex + 1}`;
};

const Home: NextPage = () => {
  const infiniteRef = useRef<HTMLDivElement | null>(null);

  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });

  const { data, size, setSize } = useSWRInfinite<GetProductsResponse>(getKey);
  const isReachingEnd = data && size === data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";

  const products = data ? data.flatMap((item) => item.products) : [];

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd, setSize, size]);

  return (
    <Layout hasTabBar seoTitle="Home" title="Home">
      <div className="container">
        <div className="-mx-4 flex flex-col divide-y">
          {products.map((product) => (
            <Item key={product.id} href={`/products/${product.id}`} title={product.name} price={product.price} hearts={product?.records?.length || 0} />
          ))}
          <div ref={infiniteRef}>{isLoading ? "loading..." : isReachingEnd ? "no more products" : ""}</div>
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

const Page: NextPage<GetProductsResponse> = (props) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [unstable_serialize(getKey)]: [props],
        },
      }}
    >
      <Home />
    </SWRConfig>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const products = await client.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    skip: 0,
  });
  return {
    props: {
      success: true,
      products: JSON.parse(JSON.stringify(products)),
      pages: 0,
    },
  };
};

export default Page;
