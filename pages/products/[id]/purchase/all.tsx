import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { getKey } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetChatsResponse } from "@api/chats";
import { GetUserResponse } from "@api/user";
import { PostProductsPurchaseResponse } from "@api/products/[id]/purchase";
// @pages
import type { NextPageWithLayout } from "@pages/_app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ChatList from "@components/lists/chatList";

const ProductPurchase: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const { data, setSize } = useSWRInfinite<GetChatsResponse>((...arg: [index: number, previousPageData: GetChatsResponse]) => {
    const options = { url: "/api/chats" };
    return getKey<GetChatsResponse>(...arg, options);
  });

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "20px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const chats = data ? data.flatMap((item) => item.chats) : null;

  const [updatePurchase, { loading: updatePurchaseLoading }] = useMutation<PostProductsPurchaseResponse>(`/api/products/${router.query.id}/purchase`, {
    onSuccess: (data) => {
      router.push(`/products/${router.query.id}/review`);
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
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container">
      {/* 최근 채팅 목록: List */}
      {chats && Boolean(chats.length) && (
        <div className="-mx-5">
          <ChatList type="button" list={chats} content="timestamp" isSingleUser={true} selectItem={purchaseItem} />
          <div ref={infiniteRef} />
          {isReachingEnd ? (
            <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">채팅을 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">채팅을 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 최근 채팅 목록: Empty */}
      {chats && !Boolean(chats.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">채팅한 이웃이 없어요.</p>
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getChats: { options: { url: string; query?: string }; response: GetChatsResponse };
}> = ({ getUser, getChats }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetChatsResponse]) => getKey<GetChatsResponse>(...arg, getChats.options))]: [getChats.response],
        },
      }}
    >
      <ProductPurchase />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // redirect: welcome
  if (!ssrUser.profile && !ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/welcome`,
      },
    };
  }

  const productId = params?.id?.toString() || "";

  // !ssrUser.profile
  // invalid params: productId
  // redirect: /products/[id]
  if (!ssrUser.profile || !productId || isNaN(+productId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // find product
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

  // invalid product: not found
  // redirect: /products/[id]
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  const role = ssrUser?.profile?.id === product.userId ? "sellUser" : "purchaseUser";
  const saleRecord = product.records.find((record) => record.kind === Kind.ProductSale);
  const purchaseRecord = product.records.find((record) => record.kind === Kind.ProductPurchase);
  const existedReview = product.reviews.find((review) => review.role === role && review[`${role}Id`] === ssrUser?.profile?.id);

  // invalid product: not my product
  // redirect: /products/id
  if (product.userId !== ssrUser?.profile?.id) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // sale product
  // redirect: /products/id
  if (saleRecord) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${product.id}`,
      },
    };
  }

  // purchase product && existed review
  // redirect: /reviews/id
  if (purchaseRecord && existedReview) {
    return {
      redirect: {
        permanent: false,
        destination: `/reviews/${existedReview.id}`,
      },
    };
  }

  // purchase product && existed review (purchase)
  // redirect: /products/id/review
  if (purchaseRecord && product.reviews.length) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${product.id}/review`,
      },
    };
  }

  // find chat
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
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(ssrUser.profile || {})),
          dummyProfile: JSON.parse(JSON.stringify(ssrUser.dummyProfile || {})),
          currentAddr: JSON.parse(JSON.stringify(ssrUser.currentAddr || {})),
        },
      },
      getChats: {
        options: {
          url: "/api/chats",
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
