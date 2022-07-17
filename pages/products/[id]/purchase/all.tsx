import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import { useSetRecoilState } from "recoil";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetChatsResponse } from "@api/chats";
import { GetProductsDetailResponse } from "@api/products/[id]";
import { PostProductsPurchaseResponse } from "@api/products/[id]/purchase";
// @components
import Chat, { ChatItem } from "@components/cards/chat";

const ProductPurchaseAll: NextPage<{
  staticProps: {
    product: GetProductsDetailResponse["product"];
  };
  getChats: { query: string; response: GetChatsResponse };
}> = ({ staticProps, getChats }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const [pageIndex, setPageIndex] = useState(1);
  const [pageItems, setPageItems] = useState<{ [key: number]: GetChatsResponse }>({ 1: getChats.response });

  // fetch data: chats
  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "0px" });

  const { data, error } = useSWR<GetChatsResponse>(router.query.id ? `/api/chats?page=${pageIndex}` : null);
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

  const isReachingEnd = pageIndex >= pageItems?.[Object.keys(pageItems).length]?.pages || false;
  const isLoading = !data && !error;
  const chats = useMemo(() => {
    // empty
    if (!Object.keys(pageItems).length) return [];
    // entry
    const entries = Object.entries(pageItems)?.sort((a, b) => a[0].localeCompare(b[0]));
    return entries?.flatMap(([key, value]) => (value === undefined ? [] : value.chats));
  }, [pageItems]);

  const purchaseItem = (item: ChatItem, user: ChatItem["users"][0]) => {
    if (updatePurchaseLoading) return;
    updatePurchase({ purchase: true, purchaseUserId: user.id });
  };

  useEffect(() => {
    if (isLoading) return;
    if (isVisible && !isReachingEnd) {
      setPageIndex((pageIndex) => pageIndex + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    setPageItems((pageItems) => ({
      ...pageItems,
      [pageIndex]: data!,
    }));
  }, [data]);

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
          <ul className="divide-y">
            {chats
              .filter((item) => item.chatMessages.length)
              .map((item) => {
                return item.users
                  .filter((chatUser) => chatUser.id !== user?.id)
                  .map((chatUser) => {
                    const usersThumbnail = chatUser.avatar || "";
                    return (
                      <li key={`${item.id}-${chatUser.id}`}>
                        <button type="button" className="relative block w-full pl-5 pr-10 py-3" onClick={() => purchaseItem(item, chatUser)}>
                          <Chat item={item} users={[chatUser]} type="timestamp" usersThumbnail={usersThumbnail} />
                          <svg className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </li>
                    );
                  });
              })}
          </ul>
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
  staticProps: {
    product: GetProductsDetailResponse["product"];
  };
  getChats: { query: string; response: GetChatsResponse };
}> = ({ staticProps, getChats }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`/api/chats?${getChats.query}`]: getChats.response,
        },
      }}
    >
      <ProductPurchaseAll {...{ staticProps, getChats }} />
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
  if (!productId || isNaN(+productId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
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
          OR: [{ kind: Kind.Sale }, { kind: Kind.Purchase }],
        },
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      reviews: true,
    },
  });

  // invalid product: not found
  // redirect: /
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  const role = ssrUser?.profile?.id === product.userId ? "sellUser" : "purchaseUser";
  const saleRecord = product.records.find((record) => record.kind === Kind.Sale);
  const purchaseRecord = product.records.find((record) => record.kind === Kind.Purchase);
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
  // redirect: /review/id
  if (purchaseRecord && existsReview) {
    return {
      redirect: {
        permanent: false,
        destination: `/review/${existsReview.id}`,
      },
    };
  }

  const totalChats = await client.chat.count({
    where: {
      users: {
        some: {
          id: ssrUser.profile?.id,
        },
      },
    },
  });

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
      staticProps: {
        product: JSON.parse(JSON.stringify(product || {})),
      },
      getChats: {
        query: `page=1`,
        response: {
          success: true,
          chats: JSON.parse(JSON.stringify(chats || [])),
          pages: Math.ceil(totalChats / 10),
        },
      },
    },
  };
});

export default Page;
