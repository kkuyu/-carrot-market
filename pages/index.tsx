import type { NextPage } from "next";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { getKey } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useInfiniteDataConverter from "@libs/client/useInfiniteDataConverter";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetProductsResponse, getProducts } from "@api/products";
import { GetUserResponse, getUser } from "@api/user";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import FloatingButtons from "@components/floatingButtons";
import ProductList from "@components/lists/productList";

const ProductsIndexPage: NextPage = () => {
  const { currentAddr, type: userType, mutate: mutateUser } = useUser();

  // fetch data
  const { data, setSize, mutate } = useSWRInfinite<GetProductsResponse>((...arg: [index: number, previousPageData: GetProductsResponse]) => {
    const options = { url: "/api/products", query: currentAddr ? `posX=${currentAddr?.emdPosX}&posY=${currentAddr?.emdPosY}&distance=${currentAddr?.emdPosDx}` : "" };
    return getKey<GetProductsResponse>(...arg, options);
  });

  // variable: visible
  const { infiniteRef, isReachingEnd, isLoading, collection } = useInfiniteDataConverter<GetProductsResponse>({ data, setSize });

  // reload: infinite list
  useEffect(() => {
    (async () => {
      if (userType === "guest") await mutateUser();
      if (!collection?.singleValue?.success && currentAddr) await mutate();
    })();
  }, [data, userType, currentAddr]);

  if (userType === "guest") return null;

  return (
    <div className="container">
      <h1 className="sr-only">판매 상품</h1>

      {/* 판매 상품: List */}
      {collection?.multiValues?.products && Boolean(collection?.multiValues?.products?.length) && (
        <>
          <ProductList list={collection?.multiValues?.products} className="-mx-5" />
          <span className="empty:hidden list-loading">{isReachingEnd ? "판매 상품을 모두 확인하였어요" : isLoading ? "판매 상품을 불러오고있어요" : null}</span>
        </>
      )}

      {/* 판매 상품: Empty */}
      {collection?.multiValues?.products && !Boolean(collection?.multiValues?.products?.length) && (
        <p className="list-empty">
          앗! {currentAddr?.emdPosNm ? `${currentAddr?.emdPosNm} 근처에는` : "근처에"}
          <br />
          등록된 판매 상품이 없어요
        </p>
      )}

      {/* 판매 상품: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />

      {/* 글쓰기 */}
      <FloatingButtons aria-label="중고거래 글쓰기" />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getProducts: { options: { url: string; query: string }; response: GetProductsResponse };
}> = ({ getUser, getProducts }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProductsResponse]) => getKey<GetProductsResponse>(...arg, getProducts.options))]: [getProducts.response],
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
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidUser
  // redirect `/welcome` OR `/account/logout`
  if (!ssrUser.profile && !ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: Object.keys(req.session).length ? `/account/logout` : `/welcome`,
      },
    };
  }

  // getProducts
  const posX = ssrUser?.currentAddr?.emdPosX;
  const posY = ssrUser?.currentAddr?.emdPosY;
  const distance = ssrUser?.currentAddr?.emdPosDx;

  const productsData =
    posX && posY && distance
      ? await getProducts({
          prevCursor: 0,
          posX,
          posY,
          distance,
        })
      : {
          products: [],
          totalCount: 0,
        };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "판매상품 | 중고거래",
    },
    header: {
      title: "",
      titleTag: "strong",
      utils: ["address", "title"],
      customUtils: [
        { type: "hamburger", pathname: "/products/categories" },
        { type: "magnifier", pathname: "/search" },
      ],
    },
    navBar: {
      utils: ["home", "chat", "profile", "story", "streams"],
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
      getProducts: {
        options: {
          url: "/api/products",
          query: `posX=${posX}&posY=${posY}&distance=${distance}`,
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(productsData || {})),
        },
      },
    },
  };
});

export default Page;
