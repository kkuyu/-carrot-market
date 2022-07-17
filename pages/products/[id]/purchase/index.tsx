import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
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
import Buttons from "@components/buttons";
import Product from "@components/cards/product";
import Chat, { ChatItem } from "@components/cards/chat";

const ProductPurchase: NextPage<{
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

  const { data, error } = useSWR<GetChatsResponse>(router.query.id ? `/api/chats?productId=${router.query.id}&page=${pageIndex}` : null);
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

  const purchaseItem = (item: ChatItem, users: ChatItem["users"]) => {
    if (updatePurchaseLoading) return;
    updatePurchase({ purchase: true, purchaseUserId: item.users[0].id });
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
      {/* 제품정보 */}
      <Link href={`/products/${staticProps.product.id}`}>
        <a className="block -mx-5 px-5 py-3 bg-gray-200">
          <Product item={staticProps.product} size="tiny" />
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
      {Boolean(chats.length) && (
        <div className="-mx-5 mt-5 border-t">
          <ul className="divide-y">
            {chats
              .filter((item) => item.chatMessages.length)
              .map((item) => {
                const users = item.users.filter((chatUser) => chatUser.id !== user?.id);
                const usersThumbnail = users.length === 1 ? users[0].avatar || "" : "";
                return (
                  <li key={item.id}>
                    <button type="button" className="relative block w-full pl-5 pr-10 py-3" onClick={() => purchaseItem(item, users)}>
                      <Chat item={item} users={users} type="timestamp" usersThumbnail={usersThumbnail} />
                      <svg className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </li>
                );
              })}
          </ul>
          <div className="py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isLoading ? "대화 중인 채팅방을 불러오고있어요" : isReachingEnd ? "대화 중인 채팅방을 모두 확인하였어요" : ""}</span>
          </div>
        </div>
      )}

      {/* 대화중인 채팅방: Empty */}
      {!Boolean(chats.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">대화 중인 이웃이 없어요.</p>
        </div>
      )}

      {/* infiniteRef */}
      <div ref={infiniteRef} />

      {(!Boolean(chats.length) || isReachingEnd) && (
        <div className="text-center">
          <Link href={`/products/${router.query.id}/purchase/all`} passHref>
            <Buttons tag="a" sort="text-link" size="sm" status="default" text="최근 채팅 목록에서 거래자 찾기" />
          </Link>
        </div>
      )}
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
      <ProductPurchase {...{ staticProps, getChats }} />
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
        },
      },
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
  if (product.records.find((record) => record.kind === Kind.Sale)) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${product.id}`,
      },
    };
  }

  // purchase product
  if (product.records.find((record) => record.kind === Kind.Purchase)) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${product.id}/review`,
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
      ...(product.id ? { productId: product.id } : {}),
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
          productId: product.id,
        },
      })
    : [];

  return {
    props: {
      staticProps: {
        product: JSON.parse(JSON.stringify(product || {})),
      },
      getChats: {
        query: `productId=${productId}&page=1`,
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
