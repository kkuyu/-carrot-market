import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
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
import { GetProfilesLikeResponse } from "@api/user/likes";
// @pages
import type { NextPageWithLayout } from "@pages/_app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ProductList from "@components/lists/productList";
import LikeProduct from "@components/groups/likeProduct";

const ProfileLikes: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const { data, setSize } = useSWRInfinite<GetProfilesLikeResponse>((...arg: [index: number, previousPageData: GetProfilesLikeResponse]) => {
    const options = { url: "/api/user/likes" };
    return getKey<GetProfilesLikeResponse>(...arg, options);
  });

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "20px" });
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
          <ProductList list={products}>
            <LikeProduct key="LikeProduct" className="absolute top-0 right-0 p-5" />
          </ProductList>
          <div ref={infiniteRef} />
          {isReachingEnd ? (
            <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">관심목록을 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">관심목록을 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 관심목록: Empty */}
      {products && !Boolean(products.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`관심목록이 존재하지 않아요`}</p>
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProducts: { options: { url: string; query?: string }; response: GetProfilesLikeResponse };
}> = ({ getUser, getProducts }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesLikeResponse]) => getKey<GetProfilesLikeResponse>(...arg, getProducts.options))]: [getProducts.response],
        },
      }}
    >
      <ProfileLikes />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

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
  // redirect: /user
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/user`,
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
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(ssrUser.profile || {})),
          dummyProfile: JSON.parse(JSON.stringify(ssrUser.dummyProfile || {})),
          currentAddr: JSON.parse(JSON.stringify(ssrUser.currentAddr || {})),
        },
      },
      getProducts: {
        options: {
          url: "/api/user/likes",
        },
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
