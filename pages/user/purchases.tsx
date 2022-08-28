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
import { GetUserPurchasesResponse } from "@api/user/purchases";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import FeedbackProduct from "@components/groups/feedbackProduct";
import ProductList from "@components/lists/productList";

const UserPurchasesPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const { data, setSize } = useSWRInfinite<GetUserPurchasesResponse>((...arg: [index: number, previousPageData: GetUserPurchasesResponse]) => {
    const options = { url: "/api/user/purchases" };
    return getKey<GetUserPurchasesResponse>(...arg, options);
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
      {/* 구매내역: List */}
      {products && Boolean(products.length) && (
        <div className="-mx-5">
          <ProductList list={products} className="border-b">
            <FeedbackProduct key="FeedbackProduct" />
          </ProductList>
          {isReachingEnd ? <span className="list-loading">구매내역을 모두 확인하였어요</span> : isLoading ? <span className="list-loading">구매내역을 불러오고있어요</span> : null}
        </div>
      )}

      {/* 구매내역: Empty */}
      {products && !Boolean(products.length) && (
        <div className="list-empty">
          <>구매내역이 존재하지 않아요</>
        </div>
      )}

      {/* 구매내역: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProducts: { options: { url: string; query?: string }; response: GetUserPurchasesResponse };
}> = ({ getUser, getProducts }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetUserPurchasesResponse]) => getKey<GetUserPurchasesResponse>(...arg, getProducts.options))]: [getProducts.response],
        },
      }}
    >
      <UserPurchasesPage />
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
          kind: Kind.ProductPurchase,
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
      title: "구매내역 | 나의 당근",
    },
    header: {
      title: "구매내역",
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
          url: "/api/user/purchases",
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
