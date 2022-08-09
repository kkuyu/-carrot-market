import type { NextPage } from "next";
import { useEffect, useRef } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { getKey } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetProductsResponse } from "@api/products";
import { GetUserResponse } from "@api/user";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import FloatingButtons from "@components/floatingButtons";
import ProductList from "@components/lists/productList";

const ProductsIndexPage: NextPage = () => {
  const { currentAddr } = useUser();
  const { changeLayout } = useLayouts();

  const { data, setSize } = useSWRInfinite<GetProductsResponse>((...arg: [index: number, previousPageData: GetProductsResponse]) => {
    const options = { url: "/api/products", query: currentAddr.emdPosNm ? `posX=${currentAddr.emdPosX}&posY=${currentAddr.emdPosY}&distance=${currentAddr.emdPosDx}` : "" };
    return getKey<GetProductsResponse>(...arg, options);
  });

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-44px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const products = data ? data.flatMap((item) => item.products) : null;

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize((size) => size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container">
      <h1 className="sr-only">판매상품</h1>

      {/* 판매상품: List */}
      {products && Boolean(products.length) && (
        <div className="-mx-5">
          <ProductList list={products} />
          <div ref={infiniteRef} />
          {isReachingEnd ? (
            <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">판매 상품을 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">판매 상품을 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 판매상품: Empty */}
      {products && !Boolean(products.length) && (
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

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProduct: { options: { url: string; query?: string }; response: GetProductsResponse };
}> = ({ getUser, getProduct }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProductsResponse]) => getKey<GetProductsResponse>(...arg, getProduct.options))]: [getProduct.response],
        },
      }}
    >
      <ProductsIndexPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile && !ssrUser.dummyProfile) invalidUser = true;
  // redirect `/welcome` OR `/user/logout`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: req?.cookies?.["carrot-market-session"] ? `/user/logout` : `/welcome`,
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
            resumeAt: "desc",
          },
          where: {
            emdPosX: { gte: posX - distance, lte: posX + distance },
            emdPosY: { gte: posY - distance, lte: posY + distance },
            AND: { records: { some: { kind: { in: Kind.ProductSale } } } },
          },
          include: {
            records: {
              where: {
                OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductLike }],
              },
              select: {
                id: true,
                kind: true,
                userId: true,
              },
            },
            chats: {
              include: {
                _count: {
                  select: {
                    chatMessages: true,
                  },
                },
              },
            },
          },
        });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "판매상품 | 중고거래",
    },
    header: {
      title: "",
      titleTag: "strong",
      utils: ["address", "title", "search"],
    },
    navBar: {
      utils: ["home", "chat", "profile", "story", "streams"],
    },
  };

  return {
    props: {
      defaultLayout,
      getUser: {
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getProduct: {
        options: {
          url: "/api/products",
          query: `posX=${posX}&posY=${posY}&distance=${distance}`,
        },
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
