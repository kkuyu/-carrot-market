import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { ProductCategory } from "@prisma/client";
// @lib
import { getCategory, getKey, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useInfiniteDataConverter from "@libs/client/useInfiniteDataConverter";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { ProductCategories } from "@api/products/types";
import { GetProductsCategoriesResponse, getProductsCategories } from "@api/products/categories/[category]";
import { GetUserResponse, getUser } from "@api/user";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ProductList from "@components/lists/productList";

const ProductsCategoryDetailPage: NextPage = () => {
  const router = useRouter();
  const { currentAddr, type: userType } = useUser();

  const currentQueries = useMemo(() => {
    const category = router?.query?.category?.toString() || "";
    return {
      searchCategory: category,
      identifyCategory: getCategory<ProductCategories>(category),
    };
  }, [router?.query]);

  // fetch data
  const { data, setSize, mutate } = useSWRInfinite<GetProductsCategoriesResponse>((...arg: [index: number, previousPageData: GetProductsCategoriesResponse]) => {
    const options = {
      url: currentQueries ? `/api/products/categories/${currentQueries?.searchCategory}` : "",
      query: currentAddr ? `posX=${currentAddr?.emdPosX}&posY=${currentAddr?.emdPosY}&distance=${currentAddr?.emdPosDx}` : "",
    };
    return getKey<GetProductsCategoriesResponse>(...arg, options);
  });

  // variable: visible
  const { infiniteRef, isReachingEnd, isLoading, collection } = useInfiniteDataConverter<GetProductsCategoriesResponse>({ data, setSize });

  // reload: infinite list
  useEffect(() => {
    (async () => {
      if (!collection?.singleValue?.success && currentAddr && currentQueries) await mutate();
    })();
  }, [data, currentAddr, currentQueries]);

  return (
    <div className="container">
      {/* 카테고리: List */}
      {collection?.multiValues?.products && Boolean(collection?.multiValues?.products?.length) && (
        <>
          <ProductList list={collection?.multiValues?.products} className="-mx-5" />
          <span className="empty:hidden list-loading">
            {isReachingEnd ? `${currentQueries?.identifyCategory?.text} 상품을 모두 확인하였어요` : isLoading ? `${currentQueries?.identifyCategory?.text} 상품을 불러오고있어요` : null}
          </span>
        </>
      )}

      {/* 카테고리: Empty */}
      {collection?.multiValues?.products && !Boolean(collection?.multiValues?.products?.length) && (
        <p className="list-empty">
          앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
          <br />
          {currentQueries?.identifyCategory?.text} 상품이 없어요
        </p>
      )}

      {/* 카테고리: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getProductsCategories: { options: { url: string; query: string }; response: GetProductsCategoriesResponse };
}> = ({ getUser, getProductsCategories }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProductsCategoriesResponse]) => getKey<GetProductsCategoriesResponse>(...arg, getProductsCategories.options))]: [
            getProductsCategories.response,
          ],
        },
      }}
    >
      <ProductsCategoryDetailPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // params
  const searchCategory = params?.category?.toString() || "";
  const identifyCategory = getCategory<ProductCategories>(searchCategory);

  // invalidCategory
  // redirect `/products/categories`
  if (!searchCategory || !identifyCategory || !isInstance(identifyCategory?.value, ProductCategory)) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/categories`,
      },
    };
  }

  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidUser
  // redirect: `/`
  if (!ssrUser?.currentAddr) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // getProductsCategories
  const posX = ssrUser?.currentAddr?.emdPosX;
  const posY = ssrUser?.currentAddr?.emdPosY;
  const distance = ssrUser?.currentAddr?.emdPosDx;

  const productsCategoriesData =
    posX && posY && distance && identifyCategory
      ? await getProductsCategories({
          prevCursor: 0,
          posX,
          posY,
          distance,
          category: identifyCategory?.value,
        })
      : {
          products: [],
          totalCount: 0,
        };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${ssrUser?.currentAddr?.emdPosNm} 근처 ${identifyCategory?.text} | 카테고리 | 중고거래`,
    },
    header: {
      title: identifyCategory?.value === "POPULAR_PRODUCT" ? `${ssrUser?.currentAddr?.emdPosNm} 근처 ${identifyCategory?.text}` : `${identifyCategory?.text}`,
      titleTag: "h1",
      utils: ["back", "title"],
      customUtils: [{ type: "magnifier", pathname: `/search?category=${identifyCategory?.kebabCaseValue}` }],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getUser: {
        options: {
          url: "/api/user",
          query: "",
        },
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getProductsCategories: {
        options: {
          url: `/api/products/categories/${identifyCategory?.kebabCaseValue}`,
          query: `posX=${posX}&posY=${posY}&distance=${distance}`,
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(productsCategoriesData || {})),
        },
      },
    },
  };
});

export default Page;
