import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import useSWR, { SWRConfig } from "swr";
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
import { GetUserResponse } from "@api/users";
import { GetProfilesDetailResponse } from "@api/profiles/[id]";
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products";
// @pages
import type { NextPageWithLayout } from "@pages/_app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import FeedbackProduct from "@components/groups/feedbackProduct";
import HandleProduct from "@components/groups/handleProduct";
import ProductList from "@components/lists/productList";

type ProductTab = {
  index: number;
  value: "products" | "products/sale" | "products/sold";
  text: string;
  name: string;
};

const ProfileProducts: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const productTabs: ProductTab[] = [
    { value: "products", index: 0, text: "전체", name: "등록된 게시글" },
    { value: "products/sale", index: 1, text: "판매중", name: "판매 중인 게시글" },
    { value: "products/sold", index: 2, text: "판매완료", name: "판매 완료된 게시글" },
  ];
  const [currentTab, setCurrentTab] = useState<ProductTab>(productTabs.find((tab) => tab.index === 0) || productTabs[0]);

  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/profiles/${router.query.id}` : null);
  const { data, setSize } = useSWRInfinite<GetProfilesProductsResponse>((...arg: [index: number, previousPageData: GetProfilesProductsResponse]) => {
    const options = { url: router.query.id ? `/api/profiles/${router.query.id}/${currentTab.value}` : "" };
    return getKey<GetProfilesProductsResponse>(...arg, options);
  });

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "20px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const products = data ? data.flatMap((item) => item.products) : null;

  const changeFilter = (tab: ProductTab) => {
    setCurrentTab(tab);
    window.scrollTo(0, 0);
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

  if (!profileData?.profile) return null;

  return (
    <div className="container">
      <div className="sticky top-12 left-0 -mx-5 flex bg-white border-b z-[1]">
        {productTabs.map((tab) => {
          return (
            <button
              key={tab.index}
              type="button"
              className={`basis-full py-2 text-sm font-semibold ${tab.value === currentTab.value ? "text-black" : "text-gray-500"}`}
              onClick={() => changeFilter(tab)}
            >
              {tab.text}
            </button>
          );
        })}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform"
          style={{ width: `${100 / productTabs.length}%`, transform: `translateX(${100 * currentTab.index}%)` }}
        />
      </div>

      {/* 판매상품: List */}
      {products && Boolean(products.length) && (
        <div className="-mx-5">
          <ProductList list={products}>
            {profileData?.profile.id === user?.id && <FeedbackProduct key="FeedbackProduct" />}
            {profileData?.profile.id === user?.id && <HandleProduct key="HandleProduct" className="p-3" />}
          </ProductList>
          <div ref={infiniteRef} />
          {isReachingEnd ? (
            <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">{currentTab?.name}을 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">{currentTab?.name}을 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 판매상품: Empty */}
      {products && !Boolean(products.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`${currentTab?.name}이 존재하지 않아요`}</p>
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProfile: { response: GetProfilesDetailResponse };
  getProductsByAll: { options: { url: string; query?: string }; response: GetProfilesProductsResponse };
  getProductsBySale: { options: { url: string; query?: string }; response: GetProfilesProductsResponse };
  getProductsBySold: { options: { url: string; query?: string }; response: GetProfilesProductsResponse };
}> = ({ getUser, getProfile, getProductsByAll, getProductsBySale, getProductsBySold }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users": getUser.response,
          [`/api/profiles/${getProfile.response.profile.id}`]: getProfile.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesProductsResponse]) => getKey<GetProfilesProductsResponse>(...arg, getProductsByAll.options))]: [
            getProductsByAll.response,
          ],
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesProductsResponse]) => getKey<GetProfilesProductsResponse>(...arg, getProductsBySold.options))]: [
            getProductsBySold.response,
          ],
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesProductsResponse]) => getKey<GetProfilesProductsResponse>(...arg, getProductsBySale.options))]: [
            getProductsBySale.response,
          ],
        },
      }}
    >
      <ProfileProducts />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // getProfile
  const profileId = params?.id?.toString() || "";

  // invalid params: profileId
  // redirect: /profiles/[id]
  if (!profileId || isNaN(+profileId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}`,
      },
    };
  }

  // find profile
  const profile = await client.user.findUnique({
    where: {
      id: +profileId,
    },
  });

  // not found profile
  // redirect: /profiles/[id]
  if (!profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}`,
      },
    };
  }

  // find product
  const productsByAll = await client.product.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      resumeAt: "desc",
    },
    where: {
      userId: profile.id,
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

  // find product by sale
  const productsBySale = await client.product.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      resumeAt: "desc",
    },
    where: {
      userId: profile.id,
      AND: {
        records: { some: { kind: Kind.ProductSale } },
      },
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

  // find product by sold
  const productsBySold = await client.product.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      resumeAt: "desc",
    },
    where: {
      userId: profile.id,
      NOT: {
        records: { some: { kind: Kind.ProductSale } },
      },
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

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `판매 상품 | ${profile?.name} | 프로필`,
    },
    header: {
      title: `${profile.name}님의 판매 상품`,
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
      getProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(profile || {})),
        },
      },
      getProductsByAll: {
        options: {
          url: `/api/profiles/${profile.id}/products`,
        },
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productsByAll || [])),
          pages: 0,
        },
      },
      getProductsBySale: {
        options: {
          url: `/api/profiles/${profile.id}/products/sale`,
        },
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productsBySale || [])),
          pages: 0,
        },
      },
      getProductsBySold: {
        options: {
          url: `/api/profiles/${profile.id}/products/sold`,
        },
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productsBySold || [])),
          pages: 0,
        },
      },
    },
  };
});

export default Page;
