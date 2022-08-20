import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { getKey } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetUserLikeResponse } from "@api/user/likes";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ProductList from "@components/lists/productList";
import LikeProduct from "@components/groups/likeProduct";

const UserLikesPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const { data, setSize } = useSWRInfinite<GetUserLikeResponse>((...arg: [index: number, previousPageData: GetUserLikeResponse]) => {
    const options = { url: "/api/user/likes" };
    return getKey<GetUserLikeResponse>(...arg, options);
  });

  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const products = data ? data.flatMap((item) => item.products) : null;

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
      {/* 관심목록: List */}
      {products && Boolean(products.length) && (
        <div className="-mx-5">
          <ProductList list={products} className="border-b">
            <LikeProduct key="LikeProduct" className="absolute top-3 right-3 p-2" />
          </ProductList>
          {isReachingEnd ? (
            <span className="block px-5 py-6 text-center text-sm text-gray-500">관심목록을 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="block px-5 py-6 text-center text-sm text-gray-500">관심목록을 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 관심목록: Empty */}
      {products && !Boolean(products.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`관심목록이 존재하지 않아요`}</p>
        </div>
      )}

      {/* 관심목록: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProducts: { options: { url: string; query?: string }; response: GetUserLikeResponse };
}> = ({ getUser, getProducts }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetUserLikeResponse]) => getKey<GetUserLikeResponse>(...arg, getProducts.options))]: [getProducts.response],
        },
      }}
    >
      <UserLikesPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile) invalidUser = true;
  // redirect `/user`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: `/user`,
      },
    };
  }

  // getRecords
  const records = ssrUser.profile
    ? await client.record.findMany({
        take: 10,
        skip: 0,
        orderBy: {
          createdAt: "desc",
        },
        where: {
          userId: ssrUser.profile.id,
          kind: Kind.ProductLike,
        },
        include: {
          product: {
            include: {
              records: {
                where: {
                  OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductLike }, { kind: Kind.ProductPurchase }],
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
              reviews: {
                select: {
                  id: true,
                  role: true,
                  sellUserId: true,
                  purchaseUserId: true,
                },
              },
            },
          },
        },
      })
    : [];

  // getProducts
  const products = records.map((record) => record.product);

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "관심목록 | 나의 당근",
    },
    header: {
      title: "관심목록",
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
      getProducts: {
        options: {
          url: "/api/user/likes",
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
