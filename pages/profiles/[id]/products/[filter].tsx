import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { getKey, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetProfilesDetailResponse } from "@api/profiles/[id]";
import { GetProfilesProductsResponse, ProductsFilterEnum } from "@api/profiles/[id]/products/[filter]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import FeedbackProduct from "@components/groups/feedbackProduct";
import HandleProduct from "@components/groups/handleProduct";
import ProductList from "@components/lists/productList";

const ProfilesProductsPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  // tabs
  const productTabs: { value: ProductsFilterEnum; text: string; name: string }[] = [
    { value: "all", text: "전체", name: "등록된 게시글" },
    { value: "sale", text: "판매중", name: "판매 중인 게시글" },
    { value: "sold", text: "판매완료", name: "판매 완료된 게시글" },
  ];
  const currentIndex = productTabs.findIndex((tab) => tab.value === router.query.filter);
  const currentTab = productTabs?.[currentIndex]!;

  // data
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/profiles/${router.query.id}` : null);
  const { data, setSize } = useSWRInfinite<GetProfilesProductsResponse>((...arg: [index: number, previousPageData: GetProfilesProductsResponse]) => {
    const options = { url: router.query.id ? `/api/profiles/${router.query.id}/products/${currentTab.value}` : "" };
    return getKey<GetProfilesProductsResponse>(...arg, options);
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

  if (!profileData?.profile) return null;

  return (
    <div className="container">
      <div className="sticky top-12 left-0 -mx-5 flex bg-white border-b z-[1]">
        {productTabs.map((tab) => {
          return (
            <Link key={tab.value} href={{ pathname: router.pathname, query: { filter: tab.value, id: router.query.id } }} replace passHref>
              <a className={`basis-full py-2 text-sm text-center font-semibold ${tab.value === router?.query?.filter ? "text-black" : "text-gray-500"}`}>{tab.text}</a>
            </Link>
          );
        })}
        <span className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform" style={{ width: `${100 / productTabs.length}%`, transform: `translateX(${100 * currentIndex}%)` }} />
      </div>

      {/* 판매상품: List */}
      {products && Boolean(products.length) && (
        <div className="-mx-5">
          <ProductList list={products} className="border-b">
            {profileData?.profile.id === user?.id ? <FeedbackProduct key="FeedbackProduct" /> : <></>}
            {profileData?.profile.id === user?.id ? <HandleProduct key="HandleProduct" className="p-3" /> : <></>}
          </ProductList>
          {isReachingEnd ? (
            <span className="block px-5 py-6 text-center text-sm text-gray-500">{currentTab?.name}을 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="block px-5 py-6 text-center text-sm text-gray-500">{currentTab?.name}을 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 판매상품: Empty */}
      {products && !Boolean(products.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`${currentTab?.name}이 존재하지 않아요`}</p>
        </div>
      )}

      {/* 판매상품: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />
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
          "/api/user": getUser.response,
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
      <ProfilesProductsPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // profileId
  const profileId: string = params?.id?.toString() || "";
  // filter
  const filter: string = params?.filter?.toString() || "";

  // invalidUrl
  let invalidUrl = false;
  if (!profileId || isNaN(+profileId)) invalidUrl = true;
  // redirect `/profiles/${profileId}`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}`,
      },
    };
  }

  // invalidFilter
  let invalidFilter = false;
  if (!filter || !isInstance(filter, ProductsFilterEnum)) invalidFilter = true;
  // redirect `/profiles/${profileId}/products/all`
  if (invalidFilter) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}/products/all`,
      },
    };
  }

  // getProfile
  const profile = await client.user.findUnique({
    where: {
      id: +profileId,
    },
  });

  // invalidProfile
  let invalidProfile = false;
  if (!profile) invalidProfile = true;
  // redirect `/profiles/${profileId}`
  if (invalidProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}`,
      },
    };
  }

  // getProductsByAll
  const productsByAll = await client.product.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      resumeAt: "desc",
    },
    where: {
      userId: profile?.id,
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

  // getProductsBySale
  const productsBySale = await client.product.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      resumeAt: "desc",
    },
    where: {
      userId: profile?.id,
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

  // getProductsBySold
  const productsBySold = await client.product.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      resumeAt: "desc",
    },
    where: {
      userId: profile?.id,
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
      title: `${profile?.name}님의 판매 상품`,
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
      getProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(profile || {})),
        },
      },
      getProductsByAll: {
        options: {
          url: `/api/profiles/${profile?.id}/products/all`,
        },
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productsByAll || [])),
        },
      },
      getProductsBySale: {
        options: {
          url: `/api/profiles/${profile?.id}/products/sale`,
        },
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productsBySale || [])),
        },
      },
      getProductsBySold: {
        options: {
          url: `/api/profiles/${profile?.id}/products/sold`,
        },
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productsBySold || [])),
        },
      },
    },
  };
});

export default Page;
