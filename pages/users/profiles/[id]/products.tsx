import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useRef, useState } from "react";
import { useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";
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
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
import { GetProfilesProductsResponse, ProfilesProductsFilter } from "@api/users/profiles/[id]/products";
// @components
import Product from "@components/cards/product";
import FeedbackProduct from "@components/groups/feedbackProduct";
import FeedbackProductOthers from "@components/groups/feedbackProductOthers";

const getKey = (pageIndex: number, previousPageData: GetProfilesProductsResponse, query: string = "", id: string ="") => {
  if (!id) return null;
  if (pageIndex === 0) return `/api/users/profiles/${id}/products?page=1&${query}`;
  if (previousPageData && !previousPageData.products.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/users/profiles/${id}/products?page=${pageIndex + 1}&${query}`;
};

type FilterTab = { index: number; value: ProfilesProductsFilter; text: string; name: string };

const ProfileProducts: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/users/profiles/${router.query.id}` : null);

  // profile product paging
  const tabs: FilterTab[] = [
    { index: 0, value: "ALL", text: "전체", name: "등록된 게시글" },
    { index: 1, value: "SALE", text: "판매중", name: "판매 중인 게시글" },
    { index: 2, value: "SOLD", text: "판매완료", name: "판매 완료된 게시글" },
  ];
  const [filter, setFilter] = useState<FilterTab["value"]>(tabs[0].value);
  const activeTab = tabs.find((tab) => tab.value === filter)!;

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });

  const { data, size, setSize } = useSWRInfinite<GetProfilesProductsResponse>((...arg: [index: number, previousPageData: GetProfilesProductsResponse]) => getKey(arg[0], arg[1], `filter=${filter}`, router.query.id ? `${router.query.id}`: ''));
  const { data: allData } = useSWR<GetProfilesProductsResponse>(router.query.id ? `/api/users/profiles/${router.query.id}/products?filter=ALL` : null);
  const { data: saleData } = useSWR<GetProfilesProductsResponse>(router.query.id ? `/api/users/profiles/${router.query.id}/products?filter=SALE` : null);
  const { data: soldData } = useSWR<GetProfilesProductsResponse>(router.query.id ? `/api/users/profiles/${router.query.id}/products?filter=SOLD` : null);

  const isReachingEnd = data && size >= data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const products = data ? data.flatMap((item) => item.products) : [];

  const changeFilter = (tab: FilterTab) => {
    setFilter(tab.value);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isVisible, isReachingEnd]);

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
          return (
            <button key={tab.index} type="button" className={`basis-full py-2 text-sm font-semibold ${tab.value === filter ? "text-black" : "text-gray-500"}`} onClick={() => changeFilter(tab)}>
              {tab.text}
              {tab.value === "ALL" && allData && allData?.total > 0 ? ` ${allData.total}` : null}
              {tab.value === "SALE" && saleData && saleData?.total > 0 ? ` ${saleData.total}` : null}
              {tab.value === "SOLD" && soldData && soldData?.total > 0 ? ` ${soldData.total}` : null}
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
                {profileData?.profile.id === user?.id && <FeedbackProductOthers item={item} />}
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
  getProductsByAll: { query: string; response: GetProfilesProductsResponse };
  getProductsBySale: { query: string; response: GetProfilesProductsResponse };
  getProductsBySold: { query: string; response: GetProfilesProductsResponse };
}> = ({ getUser, getProfile, getProductsByAll, getProductsBySale, getProductsBySold }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [`/api/users/profiles/${getProfile.response.profile.id}`]: getProfile.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesProductsResponse]) => getKey(arg[0], arg[1], getProductsByAll.query, `${getProfile.response.profile.id}`))]: [getProductsByAll.response],
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesProductsResponse]) => getKey(arg[0], arg[1], getProductsBySold.query, `${getProfile.response.profile.id}`))]: [getProductsBySold.response],
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesProductsResponse]) => getKey(arg[0], arg[1], getProductsBySale.query, `${getProfile.response.profile.id}`))]: [getProductsBySale.response],
        },
      }}
    >
      <ProfileProducts />
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

  // find product
  const productByAll = await client.product.findMany({
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

  // find product by sale
  const productBySale = await client.product.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      resumeAt: "desc",
    },
    where: {
      userId: profile.id,
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

  // find product by sold
  const productBySold = await client.product.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      resumeAt: "desc",
    },
    where: {
      userId: profile.id,
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
      getProductsByAll: {
        query: `filter=ALL`,
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productByAll || [])),
          pages: 0,
        },
      },
      getProductsBySale: {
        query: `filter=SALE`,
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productBySale || [])),
          pages: 0,
        },
      },
      getProductsBySold: {
        query: `filter=SOLD`,
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(productBySold || [])),
          pages: 0,
        },
      },
    },
  };
});

export default Page;
