import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { PageLayout } from "@libs/states";
import { getDiffTimeStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/users/my";
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
import { GetProfilesReviewsResponse, ProfilesReviewsFilter } from "@api/users/profiles/[id]/reviews";
// @components
import Profiles from "@components/profiles";
import ReviewList from "@components/lists/reviewList";

const getKey = (pageIndex: number, previousPageData: GetProfilesReviewsResponse, query: string = "", id: string = "") => {
  if (!id) return null;
  if (pageIndex === 0) return `/api/users/profiles/${id}/reviews?page=1&${query}`;
  if (previousPageData && !previousPageData.reviews.length) return null;
  if (pageIndex + 1 > previousPageData.pages) return null;
  return `/api/users/profiles/${id}/reviews?page=${pageIndex + 1}&${query}`;
};

type FilterTab = { index: number; value: ProfilesReviewsFilter; text: string; name: string };

const ProfileProducts: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/users/profiles/${router.query.id}` : null);

  const [mounted, setMounted] = useState(false);

  // profile review paging
  const tabs: FilterTab[] = [
    { index: 0, value: "ALL", text: "전체", name: "전체 후기" },
    { index: 1, value: "SELL_USER", text: "판매자 후기", name: "판매자 후기" },
    { index: 2, value: "PURCHASE_USER", text: "구매자 후기", name: "구매자 후기" },
  ];
  const [filter, setFilter] = useState<FilterTab["value"]>(tabs[0].value);
  const activeTab = tabs.find((tab) => tab.value === filter)!;

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "-64px" });

  const { data, size, setSize } = useSWRInfinite<GetProfilesReviewsResponse>((...arg: [index: number, previousPageData: GetProfilesReviewsResponse]) =>
    getKey(arg[0], arg[1], `filter=${filter}`, router.query.id ? `${router.query.id}` : "")
  );
  const { data: allData } = useSWR<GetProfilesReviewsResponse>(router.query.id ? `/api/users/profiles/${router.query.id}/reviews?filter=ALL&type=ONLY_COUNT` : null);
  const { data: sellUserData } = useSWR<GetProfilesReviewsResponse>(router.query.id ? `/api/users/profiles/${router.query.id}/reviews?filter=SELL_USER&type=ONLY_COUNT` : null);
  const { data: purchaseUserData } = useSWR<GetProfilesReviewsResponse>(router.query.id ? `/api/users/profiles/${router.query.id}/reviews?filter=PURCHASE_USER&type=ONLY_COUNT` : null);

  const isReachingEnd = data && size >= data[data.length - 1].pages;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const reviews = data ? data.flatMap((item) => item.reviews) : [];

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
    setMounted(true);
    setLayout(() => ({
      title: "거래 후기 상세",
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
      <div className="sticky top-12 left-0 -mx-5 flex bg-white border-b z-[1]">
        {tabs.map((tab) => {
          return (
            <button key={tab.index} type="button" className={`basis-full py-2 text-sm font-semibold ${tab.value === filter ? "text-black" : "text-gray-500"}`} onClick={() => changeFilter(tab)}>
              {tab.text}
              {tab.value === "ALL" && allData && allData?.total > 0 ? ` ${allData.total}` : null}
              {tab.value === "SELL_USER" && sellUserData && sellUserData?.total > 0 ? ` ${sellUserData.total}` : null}
              {tab.value === "PURCHASE_USER" && purchaseUserData && purchaseUserData?.total > 0 ? ` ${purchaseUserData.total}` : null}
            </button>
          );
        })}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform"
          style={{ width: `${100 / tabs.length}%`, transform: `translateX(${100 * activeTab.index}%)` }}
        />
      </div>

      {/* 거래후기: List */}
      {Boolean(reviews.length) && (
        <div className="mt-3">
          <ReviewList list={reviews} />
          <div className="py-6 text-center">
            <span className="text-sm text-gray-500">{isLoading ? `${activeTab?.name}를 불러오고있어요` : isReachingEnd ? `${activeTab?.name}를 모두 확인하였어요` : ""}</span>
          </div>
        </div>
      )}

      {/* 거래후기: Empty */}
      {!Boolean(reviews.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`${activeTab?.name}가 존재하지 않아요`}</p>
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
  getReviewsByAll: { query: string; response: GetProfilesReviewsResponse };
  getReviewsBySellUser: { query: string; response: GetProfilesReviewsResponse };
  getReviewsByPurchaseUser: { query: string; response: GetProfilesReviewsResponse };
}> = ({ getUser, getProfile, getReviewsByAll, getReviewsBySellUser, getReviewsByPurchaseUser }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [`/api/users/profiles/${getProfile.response.profile.id}`]: getProfile.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesReviewsResponse]) => getKey(arg[0], arg[1], getReviewsByAll.query, `${getProfile.response.profile.id}`))]: [
            getReviewsByAll.response,
          ],
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesReviewsResponse]) => getKey(arg[0], arg[1], getReviewsBySellUser.query, `${getProfile.response.profile.id}`))]: [
            getReviewsBySellUser.response,
          ],
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesReviewsResponse]) => getKey(arg[0], arg[1], getReviewsByPurchaseUser.query, `${getProfile.response.profile.id}`))]:
            [getReviewsByPurchaseUser.response],
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
  });

  // not found profile
  // 404
  if (!profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/users/profiles/${profileId}`,
      },
    };
  }

  // find review
  const reviewsByAll = await client.review.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      satisfaction: {
        not: "dislike",
      },
      OR: [
        { role: "sellUser", purchaseUserId: profile.id, product: { userId: { not: profile.id } } },
        { role: "purchaseUser", sellUserId: profile.id, product: { userId: { equals: profile.id } } },
      ],
    },
    include: {
      purchaseUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      sellUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  // find review by sell user
  const reviewsBySellUser = await client.review.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      satisfaction: {
        not: "dislike",
      },
      OR: [{ role: "sellUser", purchaseUserId: profile.id, product: { userId: { not: profile.id } } }],
    },
    include: {
      purchaseUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      sellUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  // find review by purchase user
  const reviewsByPurchaseUser = await client.review.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      satisfaction: {
        not: "dislike",
      },
      OR: [{ role: "purchaseUser", sellUserId: profile.id, product: { userId: { equals: profile.id } } }],
    },
    include: {
      purchaseUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      sellUser: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
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
      getReviewsByAll: {
        query: `filter=ALL`,
        response: {
          success: true,
          reviews: JSON.parse(JSON.stringify(reviewsByAll.map((review) => ({ ...review, satisfaction: "", productId: 0 })) || [])),
          pages: 0,
        },
      },
      getReviewsBySellUser: {
        query: `filter=SELL_USER`,
        response: {
          success: true,
          reviews: JSON.parse(JSON.stringify(reviewsBySellUser.map((review) => ({ ...review, satisfaction: "", productId: 0 })) || [])),
          pages: 0,
        },
      },
      getReviewsByPurchaseUser: {
        query: `filter=PURCHASE_USER`,
        response: {
          success: true,
          reviews: JSON.parse(JSON.stringify(reviewsByPurchaseUser.map((review) => ({ ...review, satisfaction: "", productId: 0 })) || [])),
          pages: 0,
        },
      },
    },
  };
});

export default Page;
