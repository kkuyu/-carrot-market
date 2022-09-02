import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { ProductCategory } from "@prisma/client";
// @lib
import { getCategory, getKey, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { ProductCategories } from "@api/products/types";
import { GetProductsResponse } from "@api/products";
import { GetUserResponse } from "@api/user";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ProductList from "@components/lists/productList";

const ProductsCategoryDetailPage: NextPage = () => {
  const router = useRouter();
  const { currentAddr, type: userType, mutate: mutateUser } = useUser();

  const category = getCategory<ProductCategories>(router.query?.category?.toString() || "");
  const { data, setSize, mutate } = useSWRInfinite<GetProductsResponse>((...arg: [index: number, previousPageData: GetProductsResponse]) => {
    const options = {
      url: `/api/products/categories/${category?.kebabCaseValue || router.query?.category?.toString()}`,
      query: currentAddr?.emdAddrNm ? `posX=${currentAddr?.emdPosX}&posY=${currentAddr?.emdPosY}&distance=${currentAddr?.emdPosDx}` : "",
    };
    return getKey<GetProductsResponse>(...arg, options);
  });

  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const products = data ? data.flatMap((item) => item.products) : null;

  useEffect(() => {
    if (isVisible && !isReachingEnd) setSize((size) => size + 1);
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    if (!data?.[0].success && category && currentAddr?.emdAddrNm) mutate();
  }, [data, category, currentAddr, userType]);

  return (
    <div className="container">
      {/* 카테고리: List */}
      {products && Boolean(products.length) && (
        <>
          <ProductList list={products} className="-mx-5 border-b" />
          <span className="empty:hidden list-loading">{isReachingEnd ? `${category?.text} 상품을 모두 확인하였어요` : isLoading ? `${category?.text} 상품을 불러오고있어요` : null}</span>
        </>
      )}

      {/* 카테고리: Empty */}
      {products && !Boolean(products.length) && (
        <p className="list-empty">
          앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
          <br />
          {category?.text} 상품이 없어요
        </p>
      )}

      {/* 카테고리: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProducts: { options: { url: string; query?: string }; response: GetProductsResponse };
}> = ({ getUser, getProducts }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProductsResponse]) => getKey<GetProductsResponse>(...arg, getProducts.options))]: [getProducts.response],
        },
      }}
    >
      <ProductsCategoryDetailPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // category
  const category = getCategory<ProductCategories>(params?.category?.toString() || "");

  // invalidCategory
  let invalidCategory = false;
  if (!category || !isInstance(category?.value, ProductCategory)) invalidCategory = true;
  if (invalidCategory) {
    // redirect `/products/categories`
    return {
      redirect: {
        permanent: false,
        destination: `/products/categories`,
      },
    };
  }

  // getProducts
  const posX = ssrUser?.currentAddr?.emdPosX;
  const posY = ssrUser?.currentAddr?.emdPosY;
  const distance = ssrUser?.currentAddr?.emdPosDx;
  const products =
    !posX || !posY || !distance
      ? []
      : await client.product.findMany({
          take: 10,
          skip: 0,
          orderBy: category?.value === "POPULAR_PRODUCT" ? [{ records: { _count: "desc" } }, { resumeAt: "desc" }] : { resumeAt: "desc" },
          where: {
            ...(category?.value === "POPULAR_PRODUCT" ? {} : { category: category?.value }),
            emdPosX: { gte: posX - distance, lte: posX + distance },
            emdPosY: { gte: posY - distance, lte: posY + distance },
          },
          include: {
            records: {
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
      title: `${ssrUser?.currentAddr?.emdPosNm} 근처 ${category?.text} | 카테고리 | 중고거래`,
    },
    header: {
      title: category?.value === "POPULAR_PRODUCT" ? `${ssrUser?.currentAddr?.emdPosNm} 근처 ${category?.text}` : `${category?.text}`,
      titleTag: "h1",
      utils: ["back", "title"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getUser: {
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getProducts: {
        options: {
          url: `/api/products/categories/${category?.kebabCaseValue}`,
          query: `posX=${posX}&posY=${posY}&distance=${distance}`,
        },
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(products || [])),
        },
      },
    },
  };
});

export default Page;
