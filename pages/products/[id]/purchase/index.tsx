import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { getKey } from "@libs/utils";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetChatsResponse } from "@api/chats";
import { GetUserResponse } from "@api/user";
import { GetProductsDetailResponse } from "@api/products/[id]";
import { PostProductsPurchaseResponse } from "@api/products/[id]/purchase";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ProductSummary from "@components/cards/productSummary";
import ChatList from "@components/lists/chatList";
import Buttons from "@components/buttons";

const ProductsPurchasePage: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();

  const { data: productData } = useSWR<GetProductsDetailResponse>(router.query.id ? `/api/products/${router.query.id}` : null);
  const { data, setSize, mutate } = useSWRInfinite<GetChatsResponse>((...arg: [index: number, previousPageData: GetChatsResponse]) => {
    const options = { url: "/api/chats", query: router.query.id ? `productId=${router.query.id}` : "" };
    return getKey<GetChatsResponse>(...arg, options);
  });

  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const chats = data ? data.flatMap((item) => item.chats) : null;

  const [updatePurchase, { loading: updatePurchaseLoading }] = useMutation<PostProductsPurchaseResponse>(`/api/products/${router.query.id}/purchase`, {
    onSuccess: (data) => {
      router.replace(`/products/${router.query.id}/review`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          break;
      }
    },
  });

  const purchaseItem = (item: GetChatsResponse["chats"][0], chatUser: GetChatsResponse["chats"][0]["users"][0]) => {
    if (updatePurchaseLoading) return;
    updatePurchase({ purchase: true, purchaseUserId: chatUser.id });
  };

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize((size) => size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    if (!data?.[0].success && router.query.id) mutate();
  }, [data, router.query.id]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container">
      {/* 제품정보 */}
      <Link href={`/products/${productData?.product.id}`}>
        <a className="block -mx-5 px-5 py-3 bg-gray-200">
          <ProductSummary item={productData?.product!} />
        </a>
      </Link>

      <div className="mt-5">
        <strong className="text-lg">
          판매가 완료되었어요
          <br />
          구매자를 선택해주세요
        </strong>
      </div>

      {/* 대화중인 채팅방: List */}
      {chats && Boolean(chats.length) && (
        <div className="-mx-5 mt-5 border-t">
          <ChatList type="button" list={chats} content="timestamp" isSingleUser={true} selectItem={purchaseItem} className="border-b" />
          {isReachingEnd ? (
            <span className="block px-5 py-6 text-center text-sm text-gray-500">채팅을 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="block px-5 py-6 text-center text-sm text-gray-500">채팅을 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 대화중인 채팅방: Empty */}
      {chats && !Boolean(chats.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">대화 중인 이웃이 없어요.</p>
        </div>
      )}

      {/* 대화중인 채팅방: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />

      {chats && (!Boolean(chats.length) || isReachingEnd) && (
        <div className="text-center">
          <Link href={`/products/${router.query.id}/purchase/all`} passHref>
            <Buttons tag="a" sort="text-link" size="sm" status="default" text="최근 채팅 목록에서 구매자 찾기" />
          </Link>
        </div>
      )}
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
      <ProductsPurchasePage />
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
        where: {
          OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductPurchase }],
        },
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      reviews: {
        select: {
          id: true,
          role: true,
          sellUserId: true,
          purchaseUserId: true,
        },
      },
    },
  });

  // invalidProduct
  let invalidProduct = false;
  if (!product) invalidProduct = true;
  if (product?.userId !== ssrUser?.profile?.id) invalidProduct = true;
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
  const role = ssrUser?.profile?.id === product?.userId ? "sellUser" : "purchaseUser";
  const saleRecord = product?.records?.find((record) => record.kind === Kind.ProductSale);
  const purchaseRecord = product?.records?.find((record) => record.kind === Kind.ProductPurchase);
  const existedReview = product?.reviews?.find((review) => review.role === role && review[`${role}Id`] === ssrUser?.profile?.id);

  // invalidCondition
  let invalidCondition = false;
  if (saleRecord) invalidCondition = true;
  // redirect `/products/${productId}`
  if (invalidCondition) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // redirect `/reviews/${existedReview.id}`
  if (purchaseRecord && existedReview) {
    return {
      redirect: {
        permanent: false,
        destination: `/reviews/${existedReview.id}`,
      },
    };
  }

  // redirect `/products/${productId}`
  if (purchaseRecord && product?.reviews?.length) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}/review`,
      },
    };
  }

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
      title: "구매자 선택 | 중고거래",
    },
    header: {
      title: "구매자 선택",
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
          pages: 0,
        },
      },
    },
  };
});

export default Page;
