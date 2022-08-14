import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
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
import { GetProfilesDetailResponse } from "@api/profiles/[id]";
import { GetProfilesReviewsResponse } from "@api/profiles/[id]/reviews";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ReviewList from "@components/lists/reviewList";

type ReviewTab = {
  index: number;
  value: "reviews" | "reviews/sellUser" | "reviews/purchaseUser";
  text: string;
  name: string;
};

const ProfilesReviewsPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  // profile review paging
  const reviewTabs: ReviewTab[] = [
    { value: "reviews", index: 0, text: "전체", name: "전체 후기" },
    { value: "reviews/sellUser", index: 1, text: "판매자 후기", name: "판매자 후기" },
    { value: "reviews/purchaseUser", index: 2, text: "구매자 후기", name: "구매자 후기" },
  ];
  const [currentTab, setCurrentTab] = useState<ReviewTab>(() => {
    return reviewTabs.find((tab) => tab.value === router?.query?.filter) || reviewTabs.find((tab) => tab.index === 0) || reviewTabs[0];
  });

  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/profiles/${router.query.id}` : null);
  const { data, setSize } = useSWRInfinite<GetProfilesReviewsResponse>((...arg: [index: number, previousPageData: GetProfilesReviewsResponse]) => {
    const options = { url: router.query.id ? `/api/profiles/${router.query.id}/${currentTab.value}` : "" };
    return getKey<GetProfilesReviewsResponse>(...arg, options);
  });

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "20px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const reviews = data ? data.flatMap((item) => item.reviews) : null;

  const changeTab = (options: { tab?: ReviewTab; tabValue?: ReviewTab["value"] }) => {
    const tab = options?.tab || reviewTabs.find((tab) => tab.value === options.tabValue) || reviewTabs.find((tab) => tab.index === 0) || reviewTabs[0];
    setCurrentTab(tab);
    window.scrollTo(0, 0);
    router.replace({ pathname: router.pathname, query: { ...router.query, filter: tab.value } }, undefined, { shallow: true });
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

  return (
    <div className="container">
      <div className="sticky top-12 left-0 -mx-5 flex bg-white border-b z-[1]">
        {reviewTabs.map((tab) => {
          return (
            <button
              key={tab.index}
              type="button"
              className={`basis-full py-2 text-sm font-semibold ${tab.value === currentTab.value ? "text-black" : "text-gray-500"}`}
              onClick={() => changeTab({ tab })}
            >
              {tab.text}
            </button>
          );
        })}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform"
          style={{ width: `${100 / reviewTabs.length}%`, transform: `translateX(${100 * currentTab.index}%)` }}
        />
      </div>

      {/* 거래후기: List */}
      {reviews && Boolean(reviews.length) && (
        <div className="mt-3">
          <ReviewList list={reviews} className="border-b" />
          <div id="infiniteRef" ref={infiniteRef} />
          {isReachingEnd ? (
            <span className="block px-5 py-6 text-center text-sm text-gray-500">{currentTab?.name}를 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="block px-5 py-6 text-center text-sm text-gray-500">{currentTab?.name}를 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 거래후기: Empty */}
      {reviews && !Boolean(reviews.length) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`${currentTab?.name}가 존재하지 않아요`}</p>
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProfile: { response: GetProfilesDetailResponse };
  getReviewsByAll: { options: { url: string; query?: string }; response: GetProfilesReviewsResponse };
  getReviewsBySellUser: { options: { url: string; query?: string }; response: GetProfilesReviewsResponse };
  getReviewsByPurchaseUser: { options: { url: string; query?: string }; response: GetProfilesReviewsResponse };
}> = ({ getUser, getProfile, getReviewsByAll, getReviewsBySellUser, getReviewsByPurchaseUser }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/profiles/${getProfile.response.profile.id}`]: getProfile.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesReviewsResponse]) => getKey<GetProfilesReviewsResponse>(...arg, getReviewsByAll.options))]: [
            getReviewsByAll.response,
          ],
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesReviewsResponse]) => getKey<GetProfilesReviewsResponse>(...arg, getReviewsBySellUser.options))]: [
            getReviewsBySellUser.response,
          ],
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesReviewsResponse]) => getKey<GetProfilesReviewsResponse>(...arg, getReviewsByPurchaseUser.options))]: [
            getReviewsByPurchaseUser.response,
          ],
        },
      }}
    >
      <ProfilesReviewsPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // profileId
  const profileId: string = params?.id?.toString() || "";

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

  // getReviewsByAll
  const reviewsByAll = await client.productReview.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      satisfaction: {
        not: "dislike",
      },
      text: {
        not: "",
      },
      OR: [
        { role: "sellUser", purchaseUserId: profile?.id, product: { userId: { not: profile?.id } } },
        { role: "purchaseUser", sellUserId: profile?.id, product: { userId: { equals: profile?.id } } },
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

  // getReviewsBySellUser
  const reviewsBySellUser = await client.productReview.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      satisfaction: {
        not: "dislike",
      },
      text: {
        not: "",
      },
      OR: [{ role: "sellUser", purchaseUserId: profile?.id, product: { userId: { not: profile?.id } } }],
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

  // getReviewsByPurchaseUser
  const reviewsByPurchaseUser = await client.productReview.findMany({
    take: 10,
    skip: 0,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      satisfaction: {
        not: "dislike",
      },
      text: {
        not: "",
      },
      OR: [{ role: "purchaseUser", sellUserId: profile?.id, product: { userId: { equals: profile?.id } } }],
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

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `받은 매너 후기 | ${profile?.name} | 프로필`,
    },
    header: {
      title: `${profile?.name}님의 받은 매너 후기`,
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
      getReviewsByAll: {
        options: {
          url: `/api/profiles/${profile?.id}/reviews`,
        },
        response: {
          success: true,
          reviews: JSON.parse(JSON.stringify(reviewsByAll.map((review) => ({ ...review, satisfaction: "", productId: 0 })) || [])),
          pages: 0,
        },
      },
      getReviewsBySellUser: {
        options: {
          url: `/api/profiles/${profile?.id}/reviews/sellUser`,
        },
        response: {
          success: true,
          reviews: JSON.parse(JSON.stringify(reviewsBySellUser.map((review) => ({ ...review, satisfaction: "", productId: 0 })) || [])),
          pages: 0,
        },
      },
      getReviewsByPurchaseUser: {
        options: {
          url: `/api/profiles/${profile?.id}/reviews/purchaseUser`,
        },
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
