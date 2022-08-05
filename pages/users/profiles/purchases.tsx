import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/users/my";
import { GetProfilesPurchasesResponse } from "@api/users/profiles/purchases";
// @components
import CustomHead from "@components/custom/head";
import FeedbackProduct from "@components/groups/feedbackProduct";
import ProductList from "@components/lists/productList";

const getKey = (pageIndex: number, previousPageData: GetProfilesPurchasesResponse) => {
  if (pageIndex === 0) return `/api/users/profiles/purchases?page=1`;
  if (previousPageData && !previousPageData.products.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/users/profiles/purchases?page=${pageIndex + 1}`;
};

const ProfilePurchase: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });

  const { data, size, setSize } = useSWRInfinite<GetProfilesPurchasesResponse>(getKey);

  const isReachingEnd = data && data?.[data.length - 1].pages > 0 && size > data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const products = data ? data.flatMap((item) => item.products) : [];

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    changeLayout({
      header: {
        title: "구매내역",
        titleTag: "h1",
        utils: ["back", "title"],
      },
      navBar: {
        utils: [],
      },
    });
  }, []);

  return (
    <div className="container">
      <CustomHead title="구매내역 | 나의 당근" />

      {/* 구매내역: List */}
      {Boolean(products.length) && (
        <div className="-mx-5">
          <ProductList list={products}>
            <FeedbackProduct key="FeedbackProduct" />
          </ProductList>
          <div ref={infiniteRef} />
          <div className="px-5 py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isReachingEnd ? `구매내역을 모두 확인하였어요` : isLoading ? `구매내역을 불러오고있어요` : ""}</span>
          </div>
        </div>
      )}

      {/* 구매내역: Empty */}
      {!Boolean(products.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">구매내역이 존재하지 않아요</p>
        </div>
      )}
    </div>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getProduct: { response: GetProfilesPurchasesResponse };
}> = ({ getUser, getProduct }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [unstable_serialize(getKey)]: [getProduct.response],
        },
      }}
    >
      <ProfilePurchase />
    </SWRConfig>
  );
};

export const getServerSideProps = withSsrSession(async ({ req }) => {
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

  // !ssrUser.profile
  // redirect: /users/profiles
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/users/profiles`,
      },
    };
  }

  // find product
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
  const products = records.map((record) => record.product);

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
      getProduct: {
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(products || [])),
          pages: 0,
        },
      },
    },
  };
});

export default Page;
