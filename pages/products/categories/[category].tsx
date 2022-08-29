import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind, ProductCategory } from "@prisma/client";
// @lib
import { getCategory, getKey, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
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
  const { changeLayout } = useLayouts();

  const category = getCategory<ProductCategories>(router.query?.category?.toString() || "");
  const { data, setSize, mutate } = useSWRInfinite<GetProductsResponse>((...arg: [index: number, previousPageData: GetProductsResponse]) => {
    const options = {
      url: `/api/products/categories/${category?.kebabValue || router.query?.category?.toString()}`,
      query: currentAddr?.emdAddrNm ? `posX=${currentAddr?.emdPosX}&posY=${currentAddr?.emdPosY}&distance=${currentAddr?.emdPosDx}` : "",
    };
    return getKey<GetProductsResponse>(...arg, options);
  });

  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const products = data ? data.flatMap((item) => item.products) : null;

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize((size) => size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    if (userType === "guest") mutateUser();
    if (!data?.[0].success && category && currentAddr?.emdAddrNm) mutate();
  }, [data, category, currentAddr, userType]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {
        hamburgerAction: {
          pathname: "/products/categories",
        },
      },
      navBar: {},
    });
  }, []);

  if (userType === "guest") return null;

  return (
    <div className="container">
      {/* 카테고리: List */}
      {products && Boolean(products.length) && (
        <div className="-mx-5">
          <ProductList list={products} className="border-b" />
          {isReachingEnd ? (
            <span className="list-loading">{category?.text} 상품을 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="list-loading">{category?.text} 상품을 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 카테고리: Empty */}
      {products && !Boolean(products.length) && (
        <div className="list-empty">
          <>
            앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
            <br />
            {category?.text} 상품이 없어요
          </>
        </div>
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

  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile && !ssrUser.dummyProfile) invalidUser = true;
  // redirect `/welcome` OR `/account/logout`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: Object.keys(req.session).length ? `/account/logout` : `/welcome`,
      },
    };
  }

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
      title: `${ssrUser?.currentAddr?.emdPosNm} 근처 ${category?.text} | 카테고리 | 중고거래`,
    },
    header: {
      title: `${ssrUser?.currentAddr?.emdPosNm} 근처 ${category?.text}`,
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
          url: `/api/products/categories/${category?.kebabValue}`,
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
