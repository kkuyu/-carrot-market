import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { getKey, truncateStr } from "@libs/utils";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
import { GetProductsChatsResponse, getProductsChats } from "@api/products/[id]/chats/[filter]";
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
  const [isValidProduct, setIsValidProduct] = useState(true);

  // fetch data
  const { data: productData } = useSWR<GetProductsDetailResponse>(router.query.id ? `/api/products/${router.query.id}?` : null);
  const { data, setSize, mutate } = useSWRInfinite<GetProductsChatsResponse>((...arg: [index: number, previousPageData: GetProductsChatsResponse]) => {
    const options = { url: router.query.id ? `/api/products/${router.query.id}/chats/all` : "", query: "" };
    return getKey<GetProductsChatsResponse>(...arg, options);
  });

  // variable data: visible
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const chats = data ? data.flatMap((item) => item.chats) : null;

  // update: isValidProduct
  useEffect(() => {
    const isInvalid = {
      user: !(productData?.productCondition?.role?.myRole === "sellUser"),
    };
    // invalid
    if (!productData?.success || !productData?.product || Object.values(isInvalid).includes(true)) {
      setIsValidProduct(false);
      const productId = router?.query?.id?.toString();
      let redirectDestination = null;
      router.replace(redirectDestination ?? `/products/${productId}`);
      return;
    }
    // valid
    setIsValidProduct(true);
  }, [productData]);

  // update: infinite list
  useEffect(() => {
    if (isVisible && !isReachingEnd) setSize((size) => size + 1);
  }, [isVisible, isReachingEnd]);

  // reload: infinite list
  useEffect(() => {
    (async () => {
      if (!data?.[0].success && router.query.id) await mutate();
    })();
  }, [data, router.query.id]);

  if (!isValidProduct) {
    return <NextError statusCode={500} />;
  }

  return (
    <div className="">
      {/* 제품정보 */}
      {productData?.product && (
        <Link href={`/products/${productData?.product?.id}`}>
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
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getProductsDetail: { options: { url: string; query: string }; response: GetProductsDetailResponse };
  getProductsChats: { options: { url: string; query: string }; response: GetProductsChatsResponse };
}> = ({ getUser, getProductsDetail, getProductsChats }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [`${getProductsDetail?.options?.url}?${getProductsDetail?.options?.query}`]: getProductsDetail.response,
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
  // params
  const productId = params?.id?.toString() || "";

  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidUser
  // redirect `/products/${productId}`
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProductsDetail
  const productsDetail =
    productId && !isNaN(+productId)
      ? await getProductsDetail({
          id: +productId,
          userId: ssrUser?.profile?.id,
        })
      : {
          product: null,
          productCondition: null,
        };
  if (!productsDetail?.product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  const isInvalid = {
    user: !(productsDetail?.productCondition?.role?.myRole === "sellUser"),
  };

  // isInvalid
  // redirect: redirectDestination ?? `/products/${productId}`,
  if (Object.values(isInvalid).includes(true)) {
    let redirectDestination = null;
    return {
      redirect: {
        permanent: false,
        destination: redirectDestination ?? `/products/${productId}`,
      },
    };
  }

  // getProductsChats
  const productsChats = ssrUser?.profile?.id
    ? await getProductsChats({
        filter: "all",
        id: +productId,
        prevCursor: 0,
        userId: ssrUser?.profile?.id,
      })
    : {
        totalCount: 0,
        chats: [],
      };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `대화 중인 채팅방 | ${truncateStr(productsDetail?.product?.name, 15)} | 중고거래`,
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
        options: {
          url: "/api/user",
          query: "",
        },
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getProductsDetail: {
        options: {
          url: `/api/products/${productId}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(productsDetail || {})),
        },
      },
      getProductsChats: {
        options: {
          url: `/api/products/${productId}/chats/all`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(productsChats || {})),
        },
      },
    },
  };
});

export default Page;
