import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetChatsResponse } from "@api/chats";
import { GetProductsDetailResponse } from "@api/products/[id]";
// @components
import Product from "@components/cards/product";
import Chat from "@components/cards/chat";

const ProductResume: NextPage<{
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

  const isReachingEnd = pageIndex >= pageItems?.[Object.keys(pageItems).length]?.pages || false;
  const isLoading = !data && !error;
  const chats = useMemo(() => {
    // empty
    if (!Object.keys(pageItems).length) return [];
    // entry
    const entries = Object.entries(pageItems)?.sort((a, b) => a[0].localeCompare(b[0]));
    return entries?.flatMap(([key, value]) => (value === undefined ? [] : value.chats));
  }, [pageItems]);

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
      title: "대화 중인 채팅방",
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

      {/* 채팅: List */}
      {Boolean(chats.length) && (
        <div className="-mx-5">
          <ul className="divide-y">
            {chats
              .filter((item) => item.chatMessages.length)
              .map((item) => {
                const users = item.users.filter((chatUser) => chatUser.id !== user?.id);
                const usersThumbnail = users.length === 1 ? users[0].avatar || "" : "";
                return (
                  <li key={item.id}>
                    <Link href={`/chats/${item.id}`}>
                      <a className="block px-5 py-3">
                        <Chat item={item} users={users} usersThumbnail={usersThumbnail} />
                      </a>
                    </Link>
                  </li>
                );
              })}
          </ul>
          <div className="py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isLoading ? "채팅을 불러오고있어요" : isReachingEnd ? "채팅을 모두 확인하였어요" : ""}</span>
          </div>
        </div>
      )}

      {/* 채팅: Empty */}
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
      <ProductResume {...{ staticProps, getChats }} />
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
  });

  // invalid product: not found
  // redirect: /
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // invalid product: not my product
  // redirect: /products/id
  if (product.userId !== ssrUser?.profile?.id || ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${product.id}`,
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
