import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetChatsResponse } from "@api/chats";
import { GetUserResponse } from "@api/users/my";
import { PostProductsPurchaseResponse } from "@api/products/[id]/purchase";
// @components
import ChatList from "@components/lists/chatList";

const getKey = (pageIndex: number, previousPageData: GetChatsResponse) => {
  if (pageIndex === 0) return `/api/chats?page=1`;
  if (previousPageData && !previousPageData.chats.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/chats?page=${pageIndex + 1}`;
};

const ProductPurchase: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });

  const { data, size, setSize } = useSWRInfinite<GetChatsResponse>(getKey);
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

  const isReachingEnd = data && size >= data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const chats = data ? data.flatMap((item) => item.chats) : [];

  const purchaseItem = (item: GetChatsResponse["chats"][0], chatUser: GetChatsResponse["chats"][0]["users"][0]) => {
    if (updatePurchaseLoading) return;
    updatePurchase({ purchase: true, purchaseUserId: chatUser.id });
  };

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    setLayout(() => ({
      title: "구매자 선택",
      header: {
        headerUtils: ["back", "title"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container">
      {/* 최근 채팅 목록: List */}
      {Boolean(chats.length) && (
        <div className="-mx-5">
          <ChatList type="button" list={chats} content="timestamp" isVisibleOnlyOneUser={true} selectItem={purchaseItem} />
          <div className="py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isLoading ? "채팅을 불러오고있어요" : isReachingEnd ? "채팅을 모두 확인하였어요" : ""}</span>
          </div>
        </div>
      )}

      {/* 최근 채팅 목록: Empty */}
      {!Boolean(chats.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">채팅한 이웃이 없어요.</p>
        </div>
      )}

      {/* infiniteRef */}
      <div ref={infiniteRef} />
    </div>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getChat: { response: GetChatsResponse };
}> = ({ getUser, getChat }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [unstable_serialize(getKey)]: [getChat.response],
        },
      }}
    >
      <ProductPurchase />
    </SWRConfig>
  );
};

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

  const productId = params?.id?.toString();

  // invalid params: productId
  // redirect: /products/[id]
  if (!productId || isNaN(+productId)) {
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
  const existsReview = product.reviews.find((review) => review.role === role && review[`${role}Id`] === ssrUser?.profile?.id);

  // invalid product: not my product
  // redirect: /products/id
  if (product.userId !== ssrUser?.profile?.id || ssrUser.dummyProfile) {
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

  // purchase product && exists review
  // redirect: /reviews/id
  if (purchaseRecord && existsReview) {
    return {
      redirect: {
        permanent: false,
        destination: `/reviews/${existsReview.id}`,
      },
    };
  }

  // purchase product && exists review (purchase)
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

  return {
    props: {
      getUser: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(ssrUser.profile || {})),
          dummyProfile: JSON.parse(JSON.stringify(ssrUser.dummyProfile || {})),
          currentAddr: JSON.parse(JSON.stringify(ssrUser.currentAddr || {})),
        },
      },
      getChat: {
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
