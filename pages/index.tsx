import type { GetServerSideProps, NextPage } from "next";

import { useEffect, useRef } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import client from "@libs/server/client";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import { GetProductsResponse } from "@api/products";

import Layout from "@components/layout";
import Item from "@components/item";
import FloatingButton from "@components/floating-button";

const getKey = (pageIndex: number, previousPageData: GetProductsResponse, addr: string = "") => {
  if (pageIndex === 0) return `/api/products?page=1&${addr}`;
  if (previousPageData && !previousPageData.products.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/products?page=${pageIndex + 1}&${addr}`;
};

const Home: NextPage = () => {
  const { user, currentAddr } = useUser();
  const infiniteRef = useRef<HTMLDivElement | null>(null);

  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });

  const { data, size, setSize } = useSWRInfinite<GetProductsResponse>((...arg: [index: number, previousPageData: GetProductsResponse]) =>
    getKey(arg[0], arg[1], currentAddr.emdPosNm ? `posX=${currentAddr.emdPosX}&posY=${currentAddr.emdPosY}&distance=${currentAddr.emdPosDx}` : "")
  );
  const isReachingEnd = data && size === data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";

  const products = data ? data.flatMap((item) => item.products) : [];

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd]);

  return (
    <Layout hasTabBar seoTitle="Home" title="Home">
      <div className="container">
        {/* 회원가입 안내 */}
        {user?.id === -1 && (
          <>
            더 많은 기능을 사용하시려면 회원가입이 필요해요
            <br />
            회원 가입하기
          </>
        )}

        {/* 리스트 */}
        {products.length ? (
          <div className="-mx-4 flex flex-col divide-y">
            {products.map((product) => (
              <Item key={product.id} href={`/products/${product.id}`} title={product.name} price={product.price} hearts={product?.records?.length || 0} />
            ))}
            <div ref={infiniteRef}>{isLoading ? "loading..." : isReachingEnd ? "no more products" : ""}</div>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-gray-500">
              앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
              <br />
              거래할 수 있는 물건이 없어요.
            </p>
          </div>
        )}

        {/* 등록 */}
        <FloatingButton href="/products/upload">
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </FloatingButton>
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
