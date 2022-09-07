import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { getKey, getProductCondition, truncateStr } from "@libs/utils";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetProductsChatsResponse, getProductsChats } from "@api/products/[id]/chats";
import { GetUserResponse, getUser } from "@api/user";
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ProductSummary from "@components/cards/productSummary";
import ChatList from "@components/lists/chatList";

const ProductsChatsPage: NextPage = () => {
  const router = useRouter();

  // variable data: invisible
  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });

  // fetch data
  const { data: productData } = useSWR<GetProductsDetailResponse>(router.query.id ? `/api/products/${router.query.id}` : null);
  const { data, setSize, mutate } = useSWRInfinite<GetProductsChatsResponse>((...arg: [index: number, previousPageData: GetProductsChatsResponse]) => {
    const options = { url: "/api/products/[id]/chats", query: router.query.id ? `filter=all&productId=${router.query.id}` : "" };
    return getKey<GetProductsChatsResponse>(...arg, options);
  });

  // variable data: visible
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const chats = data ? data.flatMap((item) => item.chats) : null;

  useEffect(() => {
    if (isVisible && !isReachingEnd) setSize((size) => size + 1);
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    if (!data?.[0].success && router.query.id) mutate();
  }, [data, router.query.id]);

  return (
    <div className="">
      {/* 제품정보 */}
      {productData?.product && (
        <Link href={`/products/${productData?.product.id}`}>
          <a className="block px-5 py-3 bg-gray-200">
            <ProductSummary item={productData?.product} {...(productData?.productCondition ? { condition: productData?.productCondition } : {})} />
          </a>
        </Link>
      )}

      <div className="container">
        {/* 채팅: List */}
        {chats && Boolean(chats.length) && (
          <>
            <ChatList list={chats} isVisibleSingleUser={false} cardProps={{ isVisibleProduct: true, isVisibleLastChatMessage: true }} className="-mx-5 border-b" />
            <span className="empty:hidden list-loading">{isReachingEnd ? "채팅을 모두 확인하였어요" : isLoading ? "채팅을 불러오고있어요" : null}</span>
          </>
        )}

        {/* 채팅: Empty */}
        {chats && !Boolean(chats.length) && (
          <p className="list-empty">
            <>채팅한 이웃이 없어요</>
          </p>
        )}

        {/* 채팅: InfiniteRef */}
        <div id="infiniteRef" ref={infiniteRef} />
      </div>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProductsDetail: { response: GetProductsDetailResponse };
  getProductsChats: { options: { url: string; query?: string }; response: GetProductsChatsResponse };
}> = ({ getUser, getProductsDetail, getProductsChats }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/products/${getProductsDetail.response.product.id}`]: getProductsDetail.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProductsChatsResponse]) => getKey<GetProductsChatsResponse>(...arg, getProductsChats.options))]: [
            getProductsChats.response,
          ],
        },
      }}
    >
      <ProductsChatsPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // productId
  const productId: string = params?.id?.toString() || "";

  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile) invalidUser = true;
  // redirect `/products/${productId}`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProductsDetail
  const { product } =
    productId && !isNaN(+productId)
      ? await getProductsDetail({
          id: +productId,
        })
      : {
          product: null,
        };
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // condition
  const productCondition = getProductCondition(product, ssrUser?.profile?.id);

  // redirect `/products/${productId}`
  if (productCondition?.role?.myRole !== "sellUser") {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProductsChats
  const { totalCount, chats } = ssrUser?.profile?.id
    ? await getProductsChats({
        prevCursor: 0,
        pageSize: 10,
        filter: "all",
        userId: ssrUser?.profile?.id,
        productId: +productId,
      })
    : {
        totalCount: 0,
        chats: [],
      };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `대화 중인 채팅방 | ${truncateStr(product?.name, 15)} | 중고거래`,
    },
    header: {
      title: "대화 중인 채팅방",
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
      getProductsDetail: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || {})),
          productCondition: JSON.parse(JSON.stringify(productCondition || {})),
        },
      },
      getProductsChats: {
        options: {
          url: "/api/products/[id]/chats",
          query: `filter=all&productId=${product?.id}`,
        },
        response: {
          success: true,
          totalCount: JSON.parse(JSON.stringify(totalCount || 0)),
          chats: JSON.parse(JSON.stringify(chats || [])),
        },
      },
    },
  };
});

export default Page;
