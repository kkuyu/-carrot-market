import type { NextPage } from "next";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { getKey } from "@libs/utils";
import useUser from "@libs/client/useUser";
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
  const { currentAddr, type: userType, mutate: mutateUser } = useUser();

  const { data, setSize, mutate } = useSWRInfinite<GetProductsResponse>((...arg: [index: number, previousPageData: GetProductsResponse]) => {
    const options = { url: "/api/products", query: currentAddr?.emdAddrNm ? `posX=${currentAddr?.emdPosX}&posY=${currentAddr?.emdPosY}&distance=${currentAddr?.emdPosDx}` : "" };
    return getKey<GetProductsResponse>(...arg, options);
  });

  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "0px" });
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
    if (!data?.[0].success && currentAddr?.emdAddrNm) mutate();
  }, [data, currentAddr, userType]);

  if (userType === "guest") return null;

  return (
    <div className="">
      <h1 className="sr-only">판매상품</h1>

      {/* 판매상품: List */}
      {products && Boolean(products.length) && (
        <>
          <ProductList list={products} className="border-b" />
          <div className="container">
            <span className="empty:hidden list-loading">{isReachingEnd ? "판매 상품을 모두 확인하였어요" : isLoading ? "판매 상품을 불러오고있어요" : null}</span>
          </div>
        </>
      )}

      {/* 판매상품: Empty */}
      {products && !Boolean(products.length) && (
        <div className="container">
          <p className="list-empty">
            앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
            <br />
            등록된 판매 상품이 없어요
          </p>
        </div>
      )}

      {/* 판매상품: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />

      {/* 글쓰기 */}
      <FloatingButtons aria-label="중고거래 글쓰기" />
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
  // redirect `/welcome` OR `/account/logout`
  if (invalidUser) {
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
      utils: ["address", "title", "search", "hamburger"],
      hamburgerAction: {
        pathname: "/products/categories",
      },
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
      getProducts: {
        options: {
          url: "/api/products",
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
