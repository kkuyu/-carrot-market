import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
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
import { GetProfilesReviewsResponse, ReviewsFilterEnum } from "@api/profiles/[id]/reviews/[filter]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ReviewList from "@components/lists/reviewList";

const ProfilesReviewsPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  // tabs
  const reviewTabs: { value: ReviewsFilterEnum; text: string; name: string }[] = [
    { value: "all", text: "전체", name: "전체 후기" },
    { value: "sellUser", text: "판매자 후기", name: "판매자 후기" },
    { value: "purchaseUser", text: "구매자 후기", name: "구매자 후기" },
  ];
  const currentIndex = reviewTabs.findIndex((tab) => tab.value === router.query.filter);
  const currentTab = reviewTabs?.[currentIndex]!;

  // data
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/profiles/${router.query.id}` : null);
  const { data, setSize } = useSWRInfinite<GetProfilesReviewsResponse>((...arg: [index: number, previousPageData: GetProfilesReviewsResponse]) => {
    const options = { url: router.query.id ? `/api/profiles/${router.query.id}/reviews/${currentTab.value}` : "" };
    return getKey<GetProfilesReviewsResponse>(...arg, options);
  });

  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const reviews = data ? data.flatMap((item) => item.reviews) : null;

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
            <Link key={tab.value} href={{ pathname: router.pathname, query: { filter: tab.value, id: router.query.id } }} replace passHref>
              <a className={`basis-full py-2 text-sm text-center font-semibold ${tab.value === router?.query?.filter ? "text-black" : "text-gray-500"}`}>{tab.text}</a>
            </Link>
          );
        })}
        <span className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform" style={{ width: `${100 / reviewTabs.length}%`, transform: `translateX(${100 * currentIndex}%)` }} />
      </div>

      {/* 거래후기: List */}
      {reviews && Boolean(reviews.length) && (
        <div className="mt-3">
          <ReviewList list={reviews} className="border-b" />
          {isReachingEnd ? <span className="list-loading">{currentTab?.name}를 모두 확인하였어요</span> : isLoading ? <span className="list-loading">{currentTab?.name}를 불러오고있어요</span> : null}
        </div>
      )}

      {/* 거래후기: Empty */}
      {reviews && !Boolean(reviews.length) && (
        <div className="list-empty">
          <>{currentTab?.name}가 존재하지 않아요</>
        </div>
      )}

      {/* 거래후기: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />
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
  if (!filter || !isInstance(filter, ReviewsFilterEnum)) invalidFilter = true;
  // redirect `/profiles/${profileId}/reviews/all`
  if (invalidFilter) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}/reviews/all`,
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
          url: `/api/profiles/${profile?.id}/reviews/all`,
        },
        response: {
          success: true,
          reviews: JSON.parse(JSON.stringify(reviewsByAll.map((review) => ({ ...review, satisfaction: "", productId: 0 })) || [])),
        },
      },
      getReviewsBySellUser: {
        options: {
          url: `/api/profiles/${profile?.id}/reviews/sellUser`,
        },
        response: {
          success: true,
          reviews: JSON.parse(JSON.stringify(reviewsBySellUser.map((review) => ({ ...review, satisfaction: "", productId: 0 })) || [])),
        },
      },
      getReviewsByPurchaseUser: {
        options: {
          url: `/api/profiles/${profile?.id}/reviews/purchaseUser`,
        },
        response: {
          success: true,
          reviews: JSON.parse(JSON.stringify(reviewsByPurchaseUser.map((review) => ({ ...review, satisfaction: "", productId: 0 })) || [])),
        },
      },
    },
  };
});

export default Page;
