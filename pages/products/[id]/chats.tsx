import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { getKey, getProductCondition, truncateStr } from "@libs/utils";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetChatsResponse } from "@api/chats";
import { GetUserResponse } from "@api/user";
import { GetProductsDetailResponse } from "@api/products/[id]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ProductSummary from "@components/cards/productSummary";
import ChatList from "@components/lists/chatList";

const ProductsChatsPage: NextPage = () => {
  const router = useRouter();

  const { data: productData } = useSWR<GetProductsDetailResponse>(router.query.id ? `/api/products/${router.query.id}` : null);
  const { data, setSize, mutate } = useSWRInfinite<GetChatsResponse>((...arg: [index: number, previousPageData: GetChatsResponse]) => {
    const options = { url: "/api/chats", query: router.query.id ? `productId=${router.query.id}` : "" };
    return getKey<GetChatsResponse>(...arg, options);
  });

  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
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
            <ChatList type="link" list={chats} sort="message" isVisibleSingleUser={false} cardProps={{ isVisibleProduct: true }} className="-mx-5 border-b" />
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
  getProduct: { response: GetProductsDetailResponse };
  getChats: { options: { url: string; query?: string }; response: GetChatsResponse };
}> = ({ getUser, getProduct, getChats }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/products/${getProduct.response.product.id}`]: getProduct.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetChatsResponse]) => getKey<GetChatsResponse>(...arg, getChats.options))]: [getChats.response],
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
  const ssrUser = await getSsrUser(req);

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

  // invalidUrl
  let invalidUrl = false;
  if (!productId || isNaN(+productId)) invalidUrl = true;
  // redirect `/products/${productId}`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProduct
  const product = await client.product.findUnique({
    where: {
      id: +productId,
    },
    include: {
      records: {
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
    },
  });

  // invalidProduct
  let invalidProduct = false;
  if (!product) invalidProduct = true;
  if (ssrUser?.profile?.id !== product?.userId) invalidProduct = true;
  // redirect `/products/${productId}`
  if (invalidProduct) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // condition
  const productCondition = getProductCondition(product, ssrUser?.profile?.id);

  // getChats
  const chats = ssrUser.profile
    ? await client.chat.findMany({
        take: 10,
        skip: 0,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
            },
          },
          chatMessages: {
            take: 1,
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
        where: {
          users: {
            some: {
              id: ssrUser.profile?.id,
            },
          },
          productId: product?.id,
        },
      })
    : [];

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
      getProduct: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || {})),
          productCondition: JSON.parse(JSON.stringify(productCondition || {})),
        },
      },
      getChats: {
        options: {
          url: "/api/chats",
          query: `productId=${product?.id}`,
        },
        response: {
          success: true,
          chats: JSON.parse(JSON.stringify(chats || [])),
        },
      },
    },
  };
});

export default Page;
