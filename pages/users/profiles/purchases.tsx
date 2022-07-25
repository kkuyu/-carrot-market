import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { useSetRecoilState } from "recoil";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/users/my";
import { GetProfilesPurchasesResponse } from "@api/users/profiles/purchases";
// @components
import FeedbackProduct from "@components/groups/feedbackProduct";
import ProductWithFeedbackList from "@components/lists/productWithFeedbackList";

const getKey = (pageIndex: number, previousPageData: GetProfilesPurchasesResponse) => {
  if (pageIndex === 0) return `/api/users/profiles/purchases?page=1`;
  if (previousPageData && !previousPageData.products.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/users/profiles/purchases?page=${pageIndex + 1}`;
};

const ProfilePurchase: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });

  const { data, size, setSize } = useSWRInfinite<GetProfilesPurchasesResponse>(getKey);

  const isReachingEnd = data && size >= data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const products = data ? data.flatMap((item) => item.products) : [];

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    setLayout(() => ({
      title: "구매내역",
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
      {/* 구매내역: List */}
      {Boolean(products.length) && (
        <div className="-mx-5">
          <ProductWithFeedbackList list={products}>
            <FeedbackProduct />
          </ProductWithFeedbackList>
          <div className="px-5 py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isLoading ? `구매내역을 불러오고있어요` : isReachingEnd ? `구매내역을 모두 확인하였어요` : ""}</span>
          </div>
        </div>
      )}

      {/* 구매내역: Empty */}
      {!Boolean(products.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`구매내역이 존재하지 않아요`}</p>
        </div>
      )}

      {/* infiniteRef */}
      <div ref={infiniteRef} />
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

  // redirect: /users/profiles
  if (ssrUser.dummyProfile) {
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
          kind: Kind.Purchase,
        },
        include: {
          product: {
            include: {
              records: {
                where: {
                  OR: [{ kind: Kind.Sale }, { kind: Kind.Favorite }, { kind: Kind.Purchase }],
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
