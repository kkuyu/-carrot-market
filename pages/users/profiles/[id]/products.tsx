import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";
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
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
import { GetProfilesProductsResponse, ProfilesProductsFilter } from "@api/users/profiles/products";
// @components
import Product from "@components/cards/product";
import FeedbackProduct from "@components/groups/feedbackProduct";

type FilterTab = {
  index: number;
  value: ProfilesProductsFilter;
  text: string;
  name: string;
};

const ProfileProducts: NextPage<{
  staticProps: {
    ALL: GetProfilesProductsResponse;
    SALE: GetProfilesProductsResponse;
    SOLD: GetProfilesProductsResponse;
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  // fetch data: profile detail
  const { user } = useUser();
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/users/profiles/${router.query.id}` : null);

  // profile product paging
  const tabs: FilterTab[] = [
    { index: 0, value: "ALL", text: "전체", name: "등록된 게시글" },
    { index: 1, value: "SALE", text: "판매중", name: "판매 중인 게시글" },
    { index: 2, value: "SOLD", text: "판매완료", name: "판매 완료된 게시글" },
  ];
  const [filter, setFilter] = useState<FilterTab["value"]>(tabs[0].value);
  const [pageIndex, setPageIndex] = useState<{ [key in ProfilesProductsFilter]: number }>({
    ALL: 1,
    SALE: 1,
    SOLD: 1,
  });
  const [pageItems, setPageItems] = useState<{ [key in ProfilesProductsFilter]: { [key: number]: GetProfilesProductsResponse } }>({
    ALL: { 1: staticProps.ALL },
    SALE: { 1: staticProps.SALE },
    SOLD: { 1: staticProps.SOLD },
  });

  // fetch data: profile product
  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "0px" });
  const { data: productData, error: productError } = useSWR<GetProfilesProductsResponse>(
    router.query.id ? `/api/users/profiles/products?id=${router.query.id}&filter=${filter}&page=${pageIndex[filter]}` : null
  );

  // profile product list
  const activeTab = tabs.find((tab) => tab.value === filter)!;
  const isReachingEnd = pageIndex[filter] >= pageItems[filter]?.[Object.keys(pageItems[filter]).length]?.pages || false;
  const isLoading = !productData && !productError;
  const products = useMemo(() => {
    // empty
    if (!Object.keys(pageItems[filter]).length) return [];
    // entry
    const entries = Object.entries(pageItems[filter])?.sort((a, b) => a[0].localeCompare(b[0]));
    return entries?.flatMap(([key, value]) => (value === undefined ? [] : value.products));
  }, [filter, pageItems]);

  const changeFilter = (tab: FilterTab) => {
    setFilter(tab.value);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (isLoading) return;
    if (isVisible && !isReachingEnd) {
      setPageIndex((pageIndex) => ({
        ...pageIndex,
        [filter]: pageIndex[filter] + 1,
      }));
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    setPageItems((pageItems) => ({
      ...pageItems,
      [filter]: {
        ...pageItems[filter],
        [pageIndex[filter]]: productData,
      },
    }));
  }, [productData]);

  useEffect(() => {
    setLayout(() => ({
      title: user?.id === profileData?.profile?.id ? "판매내역" : `${profileData?.profile.name}님의 판매상품`,
      header: {
        headerUtils: ["back", "title"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  if (!profileData?.profile) {
    return <NextError statusCode={404} />;
  }

  return (
    <div className="container">
      <div className="sticky top-12 left-0 -mx-5 flex bg-white border-b z-[1]">
        {tabs.map((tab) => {
          const entries = Object.entries(pageItems[tab.value])?.sort((a, b) => a[0].localeCompare(b[0]));
          const total = entries.length ? entries[0]?.[1]?.total : 0;
          return (
            <button key={tab.index} type="button" className={`basis-full py-2 text-sm font-semibold ${tab.value === filter ? "text-black" : "text-gray-500"}`} onClick={() => changeFilter(tab)}>
              {`${tab.text}${total > 0 ? ` ${total}` : ""}`}
            </button>
          );
        })}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform"
          style={{ width: `${100 / tabs.length}%`, transform: `translateX(${100 * activeTab.index}%)` }}
        />
      </div>

      {/* 판매상품: List */}
      {Boolean(products.length) && (
        <div className="-mx-5">
          <ul className="divide-y-8">
            {products.map((item) => (
              <li key={item?.id} className="relative">
                <Link href={`/products/${item?.id}`}>
                  <a className="block p-5">
                    <Product item={item} />
                  </a>
                </Link>
                {profileData?.profile.id === user?.id && <FeedbackProduct item={item} />}
              </li>
            ))}
          </ul>
          <div className="px-5 py-6 text-center border-t">
            <span className="text-sm text-gray-500">{isLoading ? `${activeTab?.name}을 불러오고있어요` : isReachingEnd ? `${activeTab?.name}을 모두 확인하였어요` : ""}</span>
          </div>
        </div>
      )}

      {/* 판매상품: Empty */}
      {!Boolean(products.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`${activeTab?.name}이 존재하지 않아요`}</p>
        </div>
      )}

      {/* infiniteRef */}
      <div ref={infiniteRef} />
    </div>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getProfile: { response: GetProfilesDetailResponse };
  getProduct: { query: string; response: GetProfilesProductsResponse };
  getProductBySale: { query: string; response: GetProfilesProductsResponse };
  getProductBySold: { query: string; response: GetProfilesProductsResponse };
}> = ({ getUser, getProfile, getProduct, getProductBySale, getProductBySold }) => {
  const profileId = getProfile.response.profile.id;
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [`/api/users/profiles/${profileId}`]: getProfile.response,
          [`/api/users/profiles/products?${getProduct.query}`]: getProduct.response,
          [`/api/users/profiles/products?${getProductBySale.query}`]: getProductBySale.response,
          [`/api/users/profiles/products?${getProductBySold.query}`]: getProductBySold.response,
        },
      }}
    >
      <ProfileProducts
        staticProps={{
          ALL: getProduct.response,
          SALE: getProductBySale.response,
          SOLD: getProductBySold.response,
        }}
      />
    </SWRConfig>
  );
};

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // getProfile
  const profileId = params?.id?.toString();

  // invalid params: profileId
  // redirect: /
  if (!profileId || isNaN(+profileId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // find profile
  const profile = await client.user.findUnique({
    where: {
      id: +profileId,
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  // not found profile
  // 404
  if (!profile) {
    return {
      notFound: true,
    };
  }

  // getProduct
  const countByAll = await client.product.count({
    where: {
      userId: +profileId,
    },
  });
  const productsByAll = await client.product.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      resumeAt: "desc",
    },
    where: {
      userId: +profileId,
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

  // getSaleProduct
  const countBySale = await client.product.count({
    where: {
      userId: +profileId,
      AND: {
        records: { some: { kind: Kind.Sale } },
      },
    },
  });
  const productsBySale = await client.product.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      resumeAt: "desc",
    },
    where: {
      userId: +profileId,
      AND: {
        records: { some: { kind: Kind.Sale } },
      },
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

  // getSoldProduct
  const countBySold = await client.product.count({
    where: {
      userId: +profileId,
      NOT: {
        records: { some: { kind: Kind.Sale } },
      },
    },
  });
  const productsBySold = await client.product.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      resumeAt: "desc",
    },
    where: {
      userId: +profileId,
      NOT: {
        records: { some: { kind: Kind.Sale } },
      },
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
      getProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(profile || {})),
        },
      },
      getProduct: {
        query: `id=${profileId}&filter=ALL&page=1`,
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productsByAll || [])),
          pages: 0,
          total: countByAll,
        },
      },
      getProductBySale: {
        query: `id=${profileId}&filter=SALE&page=1`,
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productsBySale || [])),
          pages: 0,
          total: countBySale,
        },
      },
      getProductBySold: {
        query: `id=${profileId}&filter=SOLD&page=1`,
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productsBySold || [])),
          pages: 0,
          total: countBySold,
        },
      },
    },
  };
});

export default Page;
