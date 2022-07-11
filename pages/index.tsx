import type { NextPage } from "next";
import { useEffect, useRef } from "react";
import { useSetRecoilState } from "recoil";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetProductsResponse } from "@api/products";
import { GetUserResponse } from "@api/users/my";
// @components
import FloatingButtons from "@components/floatingButtons";
import Product from "@components/cards/product";
import Link from "next/link";

const getKey = (pageIndex: number, previousPageData: GetProductsResponse, query: string = "") => {
  if (pageIndex === 0) return `/api/products?page=1&${query}`;
  if (previousPageData && !previousPageData.products.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/products?page=${pageIndex + 1}&${query}`;
};

const ProductHome: NextPage = () => {
  const { currentAddr } = useUser();
  const setLayout = useSetRecoilState(PageLayout);

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

  useEffect(() => {
    setLayout(() => ({
      seoTitle: "홈",
      header: {
        headerUtils: ["address", "search"],
      },
      navBar: {
        navBarUtils: ["home", "inbox", "profile", "story", "streams"],
      },
    }));
  }, []);

  return (
    <div className="container">
      {/* 판매상품: List */}
      {Boolean(products.length) && (
        <div className="-mx-5">
          <ul className="divide-y">
            {products.map((item) => (
              <li key={item?.id}>
                <Link href={`/products/${item?.id}`}>
                  <a className="block p-5">
                    <Product item={item} />
                  </a>
                </Link>
              </li>
            ))}
          </ul>
          <div ref={infiniteRef} className="px-5 py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isLoading ? "판매 상품을 불러오고있어요" : isReachingEnd ? "판매 상품을 모두 확인하였어요" : ""}</span>
          </div>
        </div>
      )}

      {/* 판매상품: Empty */}
      {!Boolean(products.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">
            앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
            <br />
            등록된 판매 상품이 없어요.
          </p>
        </div>
      )}

      {/* 글쓰기 */}
      <FloatingButtons href="/products/upload">
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </FloatingButtons>
    </div>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getProduct: { query: string; response: GetProductsResponse };
}> = ({ getUser, getProduct }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProductsResponse]) => getKey(arg[0], arg[1], getProduct.query))]: [getProduct.response],
        },
      }}
    >
      <ProductHome />
    </SWRConfig>
  );
};

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // redirect: welcome
  if (!ssrUser.profile && !ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/welcome`,
      },
    };
  }

  // getProduct
  const posX = ssrUser?.currentAddr?.emdPosX;
  const posY = ssrUser?.currentAddr?.emdPosY;
  const distance = ssrUser?.currentAddr?.emdPosDx;

  const products =
    !posX || !posY || !distance
      ? []
      : await client.product.findMany({
          take: 10,
          skip: 0,
          orderBy: {
            createdAt: "desc",
          },
          where: {
            emdPosX: { gte: posX - distance, lte: posX + distance },
            emdPosY: { gte: posY - distance, lte: posY + distance },
          },
        });

  return {
    props: {
      getUser: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(ssrUser.profile || {})),
          dummyProfile: JSON.parse(JSON.stringify(ssrUser.dummyProfile || {})),
          currentAddr: JSON.parse(JSON.stringify(ssrUser.currentAddr || {})),
        },
      },
      getProduct: {
        query: `posX=${posX}&posY=${posY}&distance=${distance}`,
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(products || [])),
          pages: 0,
        },
      },
    },
  };
});

export default Page;
